import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Contact Manager</h1>
      <p className="mb-6">A simple CRUD app to store and manage contacts.</p>
      <div className="space-x-3">
        <Link href="/contacts" className="px-4 py-2 bg-blue-600 text-white rounded">Open Contacts</Link>
        <Link href="/contacts/new" className="px-4 py-2 bg-green-600 text-white rounded">Add Contact</Link>
      </div>
    </div>
  )
}
