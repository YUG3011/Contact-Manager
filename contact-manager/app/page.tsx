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
          <div className="mt-3 text-slate-600">
            <ul className="list-inside list-disc space-y-1">
              <li>AI Smart Fill</li>
              <li>AI Name Suggest</li>
              <li>Filter &amp; Search (professional search and filters)</li>
              <li>Trash (soft-delete, restore, permanent delete)</li>
              <li>Email Auto‑Generator</li>
              <li>Duplicate Detection</li>
              <li>Create / Read / Update / Delete Contacts</li>
              <li>MongoDB Atlas Persistence (Prisma)</li>
              <li>Additional Contact Fields (company, role, city,phone,email, birthdate,city)</li>
              <li>Inline Missing‑Field Hints</li>
              <li>NextAuth (GitHub) Integration</li>
              <li>Notes Sentiment (stub)</li>
            </ul>
          </div>
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
