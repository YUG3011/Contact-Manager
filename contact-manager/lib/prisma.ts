// If DATABASE_URL is not set (no MongoDB configured), provide an in-memory fallback
let _prisma: any

if (!process.env.DATABASE_URL) {
  type Contact = {
    id: string
    name: string
    email: string
    phone?: string | null
    notes?: string | null
    createdAt: Date
  }

  const store = new Map<string, Contact>()

  const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

  // Simple in-memory mock matching the Prisma API surface used in this app
  // Note: This is non-persistent and intended for local dev without a DB.
  _prisma = {
    contact: {
      findMany: async (opts?: any) => {
        const arr = Array.from(store.values())
        // support ordering by createdAt desc
        if (opts?.orderBy?.createdAt === 'desc') {
          arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return arr
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return store.get(where.id) ?? null
      },
      create: async ({ data }: { data: any }) => {
        const id = makeId()
        const contact: Contact = {
          id,
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          notes: data.notes ?? null,
          createdAt: new Date(),
        }
        store.set(id, contact)
        return contact
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const existing = store.get(where.id)
        if (!existing) throw new Error('Not found')
        const updated = { ...existing, ...data }
        store.set(where.id, updated)
        return updated
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const existing = store.get(where.id)
        if (!existing) throw new Error('Not found')
        store.delete(where.id)
        return existing
      },
    },
  }
} else {
  // Lazy-require Prisma only when DATABASE_URL is present to avoid schema validation errors
  // during local dev without a database.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client')

  declare global {
    // eslint-disable-next-line no-var
    var prisma: InstanceType<typeof PrismaClient> | undefined
  }

  _prisma = global.prisma || new PrismaClient()
  if (process.env.NODE_ENV !== 'production') global.prisma = _prisma
}

export const prisma = _prisma
