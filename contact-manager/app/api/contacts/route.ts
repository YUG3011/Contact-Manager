import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, notes } = body
    if (!name || !email) return NextResponse.json({ error: 'Missing' }, { status: 400 })
    const created = await prisma.contact.create({ data: { name, email, phone, notes } })
    return NextResponse.json(created)
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
