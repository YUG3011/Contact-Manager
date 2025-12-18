import { NextResponse } from 'next/server'

export async function GET() {
  const usingInMemory = !process.env.DATABASE_URL
  return NextResponse.json({ usingInMemory, databaseUrlSet: !!process.env.DATABASE_URL })
}
