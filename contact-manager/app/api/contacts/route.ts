import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } })
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
