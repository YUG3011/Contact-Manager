"use client"
import Link from 'next/link'
import DeleteContactButton from './DeleteContactButton'
import RestoreContactButton from './RestoreContactButton'

export default function ContactList({ contacts }: { contacts: any[] }) {
  function formatDate(value: any) {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
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
              <div className="font-medium truncate">
                {c.name}
                <span className="text-slate-400"> · </span>
                {c.phone || '—'}
              </div>
              <div className="mt-1 text-sm text-slate-600 truncate">
                {c.email}
                <span className="text-slate-300"> · </span>
                {c.company || '—'}
                <span className="text-slate-300"> · </span>
                {c.role || '—'}
                {c.city ? (
                  <>
                    <span className="text-slate-300"> · </span>
                    {c.city}
                  </>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Created: {formatDate(c.createdAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/contacts/${c.id}`} className="btn-secondary shrink-0">
                View
              </Link>
              {c.deletedAt ? (
                <>
                  <RestoreContactButton id={c.id} />
                  <DeleteContactButton id={c.id} force />
                </>
              ) : (
                <DeleteContactButton id={c.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
