const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const recent = await prisma.contact.count({ where: { updatedAt: { gte: new Date('2025-12-13') } } })
  console.log('recent count', recent)

  const missingEmail = await prisma.contact.count({ where: { AND: [{ OR: [{ email: { equals: null } }, { email: '' }] }] } })
  console.log('missingEmail count', missingEmail)

  const dateOnly = await prisma.contact.count({ where: { AND: [{ updatedAt: { gte: new Date('2025-12-13') } }] } })
  console.log('dateOnly AND count', dateOnly)

  const companyGoogle = await prisma.contact.findMany({ where: { company: { equals: 'Google', mode: 'insensitive' } }, select: { id: true, company: true } })
  console.log('company Google', companyGoogle)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
