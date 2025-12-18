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
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(initial?.id)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const parsed = ContactSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues.map((x) => x.message).join(', '))
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone?.trim() ? form.phone : null,
        notes: form.notes?.trim() ? form.notes : null,
      }

      const url = isEdit ? `/api/contacts/${initial.id}` : '/api/contacts'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || 'Request failed')
      }

      setSuccess(isEdit ? 'Updated successfully.' : 'Saved successfully.')

      // Give a brief moment so the user can see the success message.
      await new Promise((r) => setTimeout(r, 800))

      window.location.href = '/contacts'
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(message ? `Save failed: ${message}` : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    const ok = window.confirm('Delete this contact? This cannot be undone.')
    if (!ok) return

    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/contacts/${initial.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      window.location.href = '/contacts'
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}
      <div>
        <label className="label">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input"
          placeholder="jane@example.com"
        />
      </div>
      <div>
        <label className="label">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input"
          placeholder="+1 555 123 4567"
        />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input min-h-28"
          placeholder="Optional notes…"
        />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="btn-secondary"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
