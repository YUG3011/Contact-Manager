import Link from 'next/link'
import ContactForm from '../../../../components/ContactForm'
import { prisma } from '../../../../lib/prisma'
import RestoreContactButton from '../../../../components/RestoreContactButton'

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params)
  const contact = await prisma.contact.findUnique({ where: { id: resolvedParams.id } })

  if (!contact) {
    return (
      <section className="grid gap-4">
        <div className="card p-6">
          <div className="text-lg font-medium">Contact not found</div>
          <div className="mt-1 text-sm text-slate-600">The contact may have been deleted.</div>
          <div className="mt-4 flex gap-2">
            <Link className="btn-secondary" href="/contacts">
              Back to contacts
            </Link>
          </div>
        </div>
      </section>
    )
  }
  // If contact is soft-deleted, prevent editing and show restore instruction
  if (contact.deletedAt) {
    return (
      <section className="grid gap-4">
        <div className="card p-6">
          <div className="text-lg font-medium">Contact is in Trash</div>
          <div className="mt-1 text-sm text-slate-600">Please restore this contact to edit it.</div>
          <div className="mt-4 flex gap-2">
            <RestoreContactButton id={contact.id} />
            <Link className="btn-ghost" href={`/contacts/${contact.id}`}>
              Back
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
          <h2 className="text-2xl font-semibold tracking-tight">Edit Contact</h2>
          <p className="mt-1 text-sm text-slate-600">Update contact information.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/contacts/${contact.id}`} className="btn-ghost">
            Back
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <ContactForm initial={contact} />
      </div>
    </section>
  )
}
