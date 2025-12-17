import Link from 'next/link'
import { prisma } from '../../lib/prisma'

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
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Contacts</h2>
          <p className="mt-1 text-sm text-slate-600">Browse and manage your saved contacts.</p>
        </div>
        <Link href="/contacts/new" className="btn-primary">
          New Contact
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {contacts.length === 0 && (
            <div className="p-6 text-sm text-slate-600">
              No contacts yet. Create your first one.
            </div>
          )}

          {contacts.map((c: any) => (
            <div key={c.id} className="p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="mt-1 text-sm text-slate-600 truncate">
                  {c.email}
                  <span className="text-slate-300"> · </span>
                  {c.phone || '—'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Created: {formatDate(c.createdAt)}
                </div>
              </div>
              <Link href={`/contacts/${c.id}`} className="btn-secondary shrink-0">
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
