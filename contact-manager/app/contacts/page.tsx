import Link from 'next/link'
import { prisma } from '../../lib/prisma'

export const dynamic = 'force-dynamic'
import ContactsView from '../../components/ContactsView'

function formatDate(value: any) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ContactsPage() {
  // keep server rendered header but let the client handle searching/fetching

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Contacts</h2>
          <p className="mt-1 text-sm text-slate-600">Your Contacts is here</p>
        </div>
        <Link href="/contacts/new" className="btn-primary">
          New Contact
        </Link>
      </div>

      <ContactsView />
    </section>
  )
}
