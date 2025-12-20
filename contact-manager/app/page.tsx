import Link from 'next/link'
import FeatureList from '../components/FeatureList'

export default function Home() {
  const items = [
    'AI Search Suggestionss',
    'AI Search Understandings',
    'Voice-to-text searchs',
    'AI Smart Filll',
    'AI Name Suggestions',
    'Filter & Search (professional search and filters))',
    'Trash (soft-delete, restore, permanent delete))',
    'Email Auto‑Generators',
    'Duplicate Detections',
    'Create / Read / Update / Delete Contactss',
    'MongoDB Atlas Persistence (Prisma))',
    'Additional Contact Fields (company, role, city,phone,email, birthdate,city)',
    'Inline Missing‑Field Hints',
    'NextAuth (GitHub) Integration',
    'Notes Sentiment (stub)',
    'Category‑wise A–Z grouping & Alphabet Navigator',
    'Favorites (star) — implemented as a copy shown in a Favorites section while leaving contacts in their A–Z groups',
    'Undo Last Action',
    'Temporary Contacts Mode(For Delete)',
    'Last Updated Badge',
    'Filter By Details',
  ]

  return (
    <section className="grid gap-6">
      <div className="card p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-slate-600">House of EdTech · Assignment</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage your contacts in one place.
          </h1>
          <div className="mt-3 text-slate-600">
            <FeatureList items={items} />
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
