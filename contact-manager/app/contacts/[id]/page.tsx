import Link from 'next/link'
import { prisma } from '../../../lib/prisma'
import CopyField from '../../../components/CopyField'
import RestoreContactButton from '../../../components/RestoreContactButton'

export default async function ContactPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params)
  const contact = await prisma.contact.findUnique({ where: { id: resolvedParams.id } })
  if (!contact) {
    return (
      <section className="grid gap-4">
        <div className="card p-6">
          <div className="text-lg font-medium">Contact not found</div>
          <div className="mt-1 text-sm text-slate-600">The contact may have been deleted.</div>
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
          <Link href="/contacts" className="btn-ghost">
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
        <div className="grid gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</div>
            <div className="mt-1">
              <CopyField value={contact.email} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Company</div>
            <div className="mt-1">
              <CopyField value={contact.company} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</div>
            <div className="mt-1">
              <CopyField value={contact.role} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</div>
            <div className="mt-1">
              <CopyField value={contact.phone || '—'} copy={Boolean(contact.phone)} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">City</div>
            <div className="mt-1">
              <CopyField value={contact.city || '—'} copy={Boolean(contact.city)} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Birthdate</div>
            <div className="mt-1">
              <CopyField value={contact.birthdate || '—'} copy={Boolean(contact.birthdate)} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</div>
            <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{contact.notes || '—'}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
