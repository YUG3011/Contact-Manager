
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request, context: any) {
  const resolvedParams = await Promise.resolve(context.params)
  const { id } = resolvedParams as { id: string }
  const url = new URL(req.url)
  const includeDeleted = url.searchParams.get('includeDeleted') === '1'
  // Avoid Prisma crashing if legacy data has invalid values (e.g. updatedAt = null)
  // by fetching the raw Mongo document via $runCommandRaw.
  let contact: any = null
  const toDate = (v: any) => {
    if (!v) return null
    if (v instanceof Date) return v
    if (typeof v === 'string' || typeof v === 'number') {
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? null : d
    }
    if (typeof v === 'object' && ('$date' in v)) {
      const d = new Date((v as any).$date)
      return Number.isNaN(d.getTime()) ? null : d
    }
    return null
  }
  try {
    const result: any = await (prisma as any).$runCommandRaw({
      find: 'Contact',
      filter: {
        _id: { $oid: id },
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      limit: 1,
    })

    const first = result?.cursor?.firstBatch?.[0]
    if (first) {
      const createdAt = toDate(first.createdAt) ?? new Date(0)
      const updatedAt = toDate(first.updatedAt) ?? createdAt
      const deletedAt = toDate(first.deletedAt)
      const expiresAt = toDate(first.expiresAt)
      contact = {
        ...first,
        id,
        _id: undefined,
        createdAt,
        updatedAt,
        deletedAt,
        expiresAt,
      }
    }
  } catch {
    // If raw Mongo query isn't available, fall back to Prisma.
    contact = await prisma.contact.findFirst({ where: includeDeleted ? { id } : { id, deletedAt: null } })
  }

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // mark lastUsed when a contact is retrieved (viewed) — best effort
  try {
    await prisma.contact.update({ where: { id }, data: { lastUsed: new Date() } })
  } catch {}

  return NextResponse.json(contact)
}

export async function PATCH(req: Request, context: any) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams as { id: string }
    const body = await req.json()

    const emailNorm = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phoneNorm = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (emailNorm) {
      const existingEmail = await prisma.contact.findFirst({
        where: { email: emailNorm, NOT: { id } },
      })
      if (existingEmail)
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      body.email = emailNorm
    }

    if (phoneNorm) {
      const existingPhone = await prisma.contact.findFirst({
        where: { phone: phoneNorm, NOT: { id } },
      })
      if (existingPhone)
        return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })
      body.phone = phoneNorm
    }

    // allow expiresAt and priority normalization
    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt)
    if (typeof body.priority === 'string' && body.priority !== '') body.priority = parseInt(body.priority, 10)

    // Build data object for update. Some generated Prisma clients may not
    // include newer fields (e.g. expiresAt) if the client wasn't regenerated.
    // Try updating with the requested fields; on a specific unknown-arg error,
    // retry without the unsupported fields to avoid throwing a 500.
    let dataForUpdate: any = { ...body }
    let updated: any
    try {
      updated = await prisma.contact.update({ where: { id }, data: dataForUpdate })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Detect Prisma 'Unknown arg' for expiresAt/priority and retry without them
      if (msg.includes('Unknown arg `expiresAt`') || msg.includes('Unknown arg `priority`')) {
        // remove unsupported fields and try again
        delete dataForUpdate.expiresAt
        delete dataForUpdate.priority
        updated = await prisma.contact.update({ where: { id }, data: dataForUpdate })
      } else {
        throw err
      }
    }
    revalidatePath('/contacts')
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams as { id: string }
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1'
    if (force) {
      await prisma.contact.delete({ where: { id } })
    } else {
      await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } })
    }
    revalidatePath('/contacts')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

export async function POST(req: Request, context: any) {
  // POST on /api/contacts/:id is used to restore a soft-deleted contact
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams as { id: string }
    // Try to clear deletedAt and any scheduled expiresAt when restoring.
    // Some Prisma clients may not support `expiresAt` if the client
    // wasn't regenerated; attempt with expiresAt first and retry without.
    const dataForUpdate: any = { deletedAt: null, expiresAt: null }
    try {
      await prisma.contact.update({ where: { id }, data: dataForUpdate })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Unknown arg `expiresAt`')) {
        // retry without expiresAt
        await prisma.contact.update({ where: { id }, data: { deletedAt: null } })
      } else {
        throw err
      }
    }
    revalidatePath('/contacts')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 })
  }
}
