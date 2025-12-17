import Link from 'next/link'

export default function Home() {
  return (
    <section className="grid gap-6">
      <div className="card p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-slate-600">House of EdTech · Assignment</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage your contacts in one place.
          </h1>
          <p className="mt-3 text-slate-600">
            Create, view, and organize contacts with a clean UI, MongoDB Atlas persistence,
            and optional GitHub sign-in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contacts" className="btn-primary">
              Open Contacts
            </Link>
            <Link href="/contacts/new" className="btn-secondary">
              Add Contact
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
