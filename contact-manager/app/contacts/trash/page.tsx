import Link from 'next/link'
import ContactsView from '../../../components/ContactsView'

export default function TrashPage() {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Trash</h2>
          <p className="mt-1 text-sm text-slate-600">Trashed contacts (soft-deleted)</p>
        </div>
        <Link href="/contacts" className="btn-ghost">
          Back to Contacts
        </Link>
      </div>

      {/* ContactsView handles fetching; initialDeletedMode='only' ensures it loads only trashed items */}
      <ContactsView initialDeletedMode="only" />
    </section>
  )
}
