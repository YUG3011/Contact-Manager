import Link from 'next/link'
import { prisma } from '../../../lib/prisma'

export default async function ContactPage({ params }: { params: { id: string } }) {
  const contact = await prisma.contact.findUnique({ where: { id: params.id } })
  if (!contact) return <div>Contact not found.</div>

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{contact.name}</h2>
        <div className="space-x-2">
          <Link href={`/contacts/${contact.id}/edit`} className="text-blue-600">Edit</Link>
        </div>
      </div>
      <div className="mt-4 bg-white p-4 rounded shadow-sm">
        <p><strong>Email:</strong> {contact.email}</p>
        <p><strong>Phone:</strong> {contact.phone || '—'}</p>
        <p className="mt-2"><strong>Notes:</strong></p>
        <p className="text-sm text-gray-700">{contact.notes || '—'}</p>
      </div>
    </div>
  )
}
