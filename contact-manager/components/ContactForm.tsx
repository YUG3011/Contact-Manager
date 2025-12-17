"use client"
import { useState } from 'react'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export default function ContactForm({ initial }: { initial?: any } = {}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    notes: initial?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = ContactSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues.map((x) => x.message).join(', '))
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      // redirect to contacts list
      window.location.href = '/contacts'
    } catch (err) {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block text-sm">Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border px-2 py-1 rounded" />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border px-2 py-1 rounded" />
      </div>
      <div>
        <label className="block text-sm">Phone</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border px-2 py-1 rounded" />
      </div>
      <div>
        <label className="block text-sm">Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border px-2 py-1 rounded" />
      </div>
      <div>
        <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  )
}
