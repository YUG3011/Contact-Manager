import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(req: Request) {
  const secret = process.env.BACKFILL_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'BACKFILL_SECRET is not configured' },
      { status: 500 },
    )
  }

  const provided = req.headers.get('x-backfill-secret')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use raw Mongo command so we can update documents even if Prisma would fail reading them.
  try {
    const findResult: any = await (prisma as any).$runCommandRaw({
      find: 'Contact',
      filter: { updatedAt: null },
      limit: 5000,
    })

    const batch = Array.isArray(findResult?.cursor?.firstBatch) ? findResult.cursor.firstBatch : []
    let updated = 0

    for (const doc of batch) {
      const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date()
      await (prisma as any).$runCommandRaw({
        update: 'Contact',
        updates: [
          {
            q: { _id: doc._id },
            u: { $set: { updatedAt: createdAt, createdAt } },
            upsert: false,
            multi: false,
          },
        ],
      })
      updated += 1
    }

    return NextResponse.json({ ok: true, updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
