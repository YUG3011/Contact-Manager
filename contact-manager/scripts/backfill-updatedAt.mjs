import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // This script fixes legacy records where updatedAt is null.
  // Prisma schema expects updatedAt to be non-null (@updatedAt), and
  // Prisma throws P2032 if it reads null.

  // MongoDB raw access through Prisma
  const raw = prisma._client
  if (!raw?.db?.collection) {
    throw new Error(
      'Unable to access MongoDB raw client via prisma._client.db. ' +
        'Are you using Prisma MongoDB and connected to the database?',
    )
  }

  const collection = raw.db.collection('Contact')

  const cursor = collection.find({ updatedAt: null })
  let count = 0

  while (await cursor.hasNext()) {
    const doc = await cursor.next()
    if (!doc) continue

    const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date()
    const updatedAt = createdAt

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          updatedAt,
          createdAt,
        },
      },
    )

    count += 1
  }

  console.log(`Backfill complete. Updated ${count} contact(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
