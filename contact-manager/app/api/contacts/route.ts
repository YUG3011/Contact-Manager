import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const company = url.searchParams.get('company') || undefined
  const role = url.searchParams.get('role') || undefined
  const city = url.searchParams.get('city') || undefined

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

  // fetch without relying on Prisma null-matching for deletedAt
  let contacts = await prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' } })

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
    const { name, email, phone, notes, city, company, role, birthdate } = body
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

    const created = await prisma.contact.create({
      data: { name, email: emailNorm, phone: phoneNorm || null, notes, city, company, role, birthdate },
    })
    return NextResponse.json(created)
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
