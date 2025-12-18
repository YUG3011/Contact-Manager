import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const count = await prisma.contact.count()
    const sample = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })

    // Diagnostics: run the same filtered query used by /api/contacts
    const filtered = await prisma.contact.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 })
    const filteredCount = filtered.length

    return NextResponse.json({ count, sample, filteredCount, filtered })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
