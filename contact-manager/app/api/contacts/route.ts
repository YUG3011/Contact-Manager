import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const company = url.searchParams.get('company') || undefined
  const role = url.searchParams.get('role') || undefined
  const city = url.searchParams.get('city') || undefined
  const sort = url.searchParams.get('sort') || 'createdAt'

  const where: any = {}

  // default: exclude soft-deleted records unless explicitly requested
  // showDeleted param behavior:
  // - absent: exclude deleted (default)
  // - '1': include both deleted and non-deleted
  // - 'only': return only deleted (trashed) records
  const showDeletedParam = url.searchParams.get('showDeleted')

  // filters
  if (company) where.company = company
  if (role) where.role = role
  if (city) where.city = city

  // search across multiple fields
  if (q) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
          { role: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
    ]
  }

  // determine ordering
  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'name') orderBy = { name: 'asc' }
  else if (sort === 'lastUsed') orderBy = { lastUsed: 'desc' }
  else if (sort === 'priority') orderBy = { priority: 'desc' }

  // IMPORTANT: Prisma can throw P2032 if any record contains invalid values
  // (e.g. updatedAt=null while schema expects DateTime). In MongoDB we can
  // bypass Prisma type parsing by using $runCommandRaw.
  // This keeps the app usable even if legacy data exists.
  let contacts: any[] = []

  // Convert this route's supported filters into a MongoDB filter.
  const mongoFilter: any = {}
  if (where.company) mongoFilter.company = where.company
  if (where.role) mongoFilter.role = where.role
  if (where.city) mongoFilter.city = where.city

  const andClauses: any[] = Array.isArray(where.AND) ? where.AND : []
  const qClause = andClauses.find((c) => c?.OR)
  if (qClause?.OR) {
    const or = qClause.OR
      .map((cond: any) => {
        const key = Object.keys(cond || {})[0]
        const value = cond?.[key]?.contains
        if (!key || typeof value !== 'string') return null
        return { [key]: { $regex: value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      })
      .filter(Boolean)

    if (or.length) mongoFilter.$or = or
  }

  // Best-effort sort mapping
  const sortSpec: Record<string, any> = {
    name: { name: 1 },
    lastUsed: { lastUsed: -1 },
    priority: { priority: -1 },
    createdAt: { createdAt: -1 },
  }
  const mongoSort = sortSpec[sort] ?? sortSpec.createdAt

  try {
    const result: any = await (prisma as any).$runCommandRaw({
      find: 'Contact',
      filter: mongoFilter,
      sort: mongoSort,
    })

    const docs = Array.isArray(result?.cursor?.firstBatch) ? result.cursor.firstBatch : []
    const toDate = (v: any) => {
      if (!v) return null
      if (v instanceof Date) return v
      if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v)
        return Number.isNaN(d.getTime()) ? null : d
      }
      // MongoDB Extended JSON
      if (typeof v === 'object' && ('$date' in v)) {
        const d = new Date((v as any).$date)
        return Number.isNaN(d.getTime()) ? null : d
      }
      return null
    }

    contacts = docs.map((doc: any) => {
      const id = doc?._id?.$oid ?? doc?._id?.toString?.() ?? String(doc?._id)
      const createdAt = toDate(doc.createdAt) ?? new Date(0)
      const updatedAt = toDate(doc.updatedAt) ?? createdAt
      const deletedAt = toDate(doc.deletedAt)
      const expiresAt = toDate(doc.expiresAt)
      return {
        ...doc,
        id,
        _id: undefined,
        createdAt,
        updatedAt,
        deletedAt,
        expiresAt,
      }
    })
  } catch (err) {
    // If $runCommandRaw isn't available in this environment, fall back to
    // the normal Prisma query.
    try {
      contacts = await prisma.contact.findMany({ where, orderBy })
    } catch (inner) {
      console.error('GET /api/contacts failed:', inner)
      const message = inner instanceof Error ? inner.message : String(inner)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (showDeletedParam === 'only') {
    contacts = contacts.filter((c: any) => c.deletedAt != null)
  } else if (showDeletedParam === '1') {
    // include both deleted and non-deleted: no further filtering
  } else {
    // default: exclude deleted
    contacts = contacts.filter((c: any) => c.deletedAt == null)
  }

  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, notes, city, company, role, birthdate, favorite, priority, expiresAt } = body
    if (!name || !email || !company || !role)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const emailNorm = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const phoneNorm = typeof phone === 'string' ? phone.trim() : ''

    if (emailNorm) {
      const existingEmail = await prisma.contact.findFirst({ where: { email: emailNorm } })
      if (existingEmail)
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    if (phoneNorm) {
      const existingPhone = await prisma.contact.findFirst({ where: { phone: phoneNorm } })
      if (existingPhone)
        return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })
    }

    if (email) {
      body.email = emailNorm
    }

    if (phone) {
      body.phone = phoneNorm
    }

    // Build create payload. Some generated Prisma clients may not include
    // newer fields (e.g. priority, expiresAt) if `prisma generate` wasn't run
    // after changing the schema. Try creating with all fields; if Prisma
    // complains about unknown args, retry without them.
    const dataForCreate: any = {
      name,
      email: emailNorm,
      phone: phoneNorm || null,
      notes,
      city,
      company,
      role,
      birthdate,
      favorite: Boolean(favorite),
      priority: typeof priority === 'number' ? priority : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }

    try {
      const created = await prisma.contact.create({ data: dataForCreate })
      return NextResponse.json(created)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // If Prisma complains about unknown args (client out-of-date), retry
      // without the unsupported fields so the request doesn't fail.
      if (msg.includes('Unknown arg `priority`') || msg.includes('Unknown arg `expiresAt`')) {
        delete dataForCreate.priority
        delete dataForCreate.expiresAt
        const created = await prisma.contact.create({ data: dataForCreate })
        return NextResponse.json(created)
      }
      // rethrow to be handled by the outer catch
      throw err
    }
  } catch (err) {
    // Log the error server-side for debugging
    console.error('POST /api/contacts error:', err)
    // Return a more informative error message to the client for debugging.
    // In production you may want to hide details and return a generic message.
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
