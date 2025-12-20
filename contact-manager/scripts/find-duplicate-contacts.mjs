import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0
}

function normalizeEmail(email) {
  if (!isNonEmptyString(email)) return null
  const e = email.trim().toLowerCase()
  return e.length ? e : null
}

function getAnyId(contact) {
  if (isNonEmptyString(contact?.id)) return String(contact.id)
  if (isNonEmptyString(contact?._id)) return String(contact._id)
  return null
}

function addToMap(map, key, value) {
  if (!key) return
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

async function main() {
  // Pull a minimal projection. Prisma schema likely defines these fields.
  // If your schema differs, adjust the select.
  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      city: true,
      role: true,
      updatedAt: true,
      createdAt: true,
      deletedAt: true,
    },
  })

  const byId = new Map()
  const byEmail = new Map()
  const byPhone = new Map()

  for (const c of contacts) {
    const id = getAnyId(c)
    const email = normalizeEmail(c.email)
    const phone = isNonEmptyString(c.phone) ? c.phone.trim() : null

    addToMap(byId, id, c)
    addToMap(byEmail, email, c)
    addToMap(byPhone, phone, c)
  }

  function summarizeList(list) {
    return list.map((c) => {
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        city: c.city,
        role: c.role,
        deletedAt: c.deletedAt,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
      }
    })
  }

  function printDuplicates(title, map, { min = 2 } = {}) {
    const dup = []
    for (const [k, list] of map.entries()) {
      if (!k) continue
      if (list.length >= min) {
        dup.push([k, list])
      }
    }

    dup.sort((a, b) => b[1].length - a[1].length)

    console.log(`\n=== ${title} (count: ${dup.length}) ===`)
    for (const [k, list] of dup) {
      console.log(`\nKey: ${k} (x${list.length})`)
      console.log(JSON.stringify(summarizeList(list), null, 2))
    }
    return dup.length
  }

  const idDupCount = printDuplicates('Duplicate IDs', byId)
  const emailDupCount = printDuplicates('Duplicate Emails (case-insensitive)', byEmail)
  const phoneDupCount = printDuplicates('Duplicate Phones', byPhone)

  console.log('\n=== Summary ===')
  console.log(JSON.stringify({ totalContacts: contacts.length, idDupCount, emailDupCount, phoneDupCount }, null, 2))
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
