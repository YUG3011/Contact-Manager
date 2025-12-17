import Link from 'next/link'
import { prisma } from '../../lib/prisma'

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Contacts</h2>
        <Link href="/contacts/new" className="px-3 py-1 bg-green-600 text-white rounded">New</Link>
      </div>

      <ul className="mt-4 space-y-2">
        {contacts.length === 0 && <li className="text-gray-500">No contacts yet.</li>}
        {contacts.map((c: any) => (
          <li key={c.id} className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">{c.email} · {c.phone || '—'}</div>
            </div>
            <div className="space-x-2">
              <Link href={`/contacts/${c.id}`} className="text-blue-600">View</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
