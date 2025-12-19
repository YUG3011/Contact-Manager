import Link from 'next/link'
import CopyField from '../../../components/CopyField'
import RestoreContactButton from '../../../components/RestoreContactButton'
import { headers } from 'next/headers'

type PageProps = {
  params: { id: string }
  searchParams?: Promise<{ from?: string }>
}

export const dynamic = 'force-dynamic'

async function getContact(id: string) {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL ?? '')

  const res = await fetch(`${baseUrl}/api/contacts/${id}?includeDeleted=1`, {
    // Ensure we don't cache per-contact reads in dev or prod.
    cache: 'no-store',
  })

  if (!res.ok) return null
  return res.json()
}

export default async function ContactPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params)
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const contact = await getContact(resolvedParams.id)
  if (!contact) {
    return (
      <section className="grid gap-4">
        <div className="card p-6">
          <div className="text-lg font-medium">Contact not found</div>
          <div className="mt-1 text-sm text-slate-600">The contact may not exist or you may not have access.</div>
          <div className="mt-4">
            <Link className="btn-secondary" href="/contacts">
              Back to contacts
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{contact.name}</h2>
          <p className="mt-1 text-sm text-slate-600">Contact details</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={resolvedSearchParams?.from === 'trash' ? '/contacts/trash' : '/contacts'} className="btn-ghost">
            Back
          </Link>
          {contact.deletedAt ? (
            <>
              <RestoreContactButton id={contact.id} />
              <button className="btn-secondary opacity-60 cursor-not-allowed" title="Restore to edit" disabled>
                Edit
              </button>
            </>
          ) : (
            <Link href={`/contacts/${contact.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="space-y-3">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-1"><CopyField value={contact.email} /></dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Company</dt>
              <dd className="mt-1"><CopyField value={contact.company} /></dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="mt-1"><CopyField value={contact.role} /></dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</dt>
              <dd className="mt-1"><CopyField value={contact.phone || '—'} copy={Boolean(contact.phone)} /></dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">City</dt>
              <dd className="mt-1"><CopyField value={contact.city || '—'} copy={Boolean(contact.city)} /></dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Birthdate</dt>
              <dd className="mt-1"><CopyField value={contact.birthdate || '—'} copy={Boolean(contact.birthdate)} /></dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{contact.notes || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
