"use client"
import { useEffect, useState } from 'react'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  city: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  birthdate: z.string().optional(),
  notes: z.string().optional(),
})

export default function ContactForm({ initial }: { initial?: any } = {}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    city: initial?.city ?? '',
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    birthdate: initial?.birthdate ?? '',
    notes: initial?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(initial?.id)
  const [deleting, setDeleting] = useState(false)
  const [smartInput, setSmartInput] = useState('')
  const [smartLoading, setSmartLoading] = useState(false)
  const [autoEmail, setAutoEmail] = useState(true)
  const [missing, setMissing] = useState<Record<string, boolean>>({})
  const [duplicate, setDuplicate] = useState<{ email?: boolean; phone?: boolean }>({})

  function generateEmail(name: string, birthdate: string) {
    if (!name.trim() || !birthdate.trim()) return ''
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
    const datePart = birthdate.replace(/-/g, '')
    return `${slug}.${datePart}@example.com`
  }

  useEffect(() => {
    if (!autoEmail) return
    const nextEmail = generateEmail(form.name, form.birthdate)
    if (!nextEmail) return
    setForm((prev) => ({ ...prev, email: nextEmail }))
    setMissing((m) => ({ ...m, email: false }))
    setDuplicate((d) => ({ ...d, email: false }))
  }, [form.name, form.birthdate, autoEmail])

  async function handleSmartFill() {
    const text = smartInput.trim()
    if (!text) {
      setError('Please describe the contact to smart-fill.')
      return
    }

    setError(null)
    setSuccess(null)
    setSmartLoading(true)
    try {
      const res = await fetch('/api/ai-auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      })

      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || 'Smart fill failed')
      }

      const json = await res.json()
      const data = json?.data ?? {}

      const filled = [data.name, data.email, data.phone, data.city, data.company, data.role].filter(Boolean)
      if (filled.length === 0) {
        throw new Error('No details could be extracted. Please add more info.')
      }

      const missingMap: Record<string, boolean> = {}
      const toCheck = ['name', 'email', 'company', 'role', 'phone', 'city'] as const
      toCheck.forEach((key) => {
        const val = (data as any)?.[key] ?? (form as any)?.[key]
        if (!val || String(val).trim() === '') missingMap[key] = true
      })

      const summary: string[] = []
      if (data.company) summary.push(`Company: ${data.company}`)
      if (data.role) summary.push(`Role: ${data.role}`)
      if (data.city) summary.push(`City: ${data.city}`)

      const summaryText = summary.join(' | ')

      setForm((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        email: data.email ?? prev.email,
        phone: data.phone ?? prev.phone,
        city: data.city ?? prev.city,
        company: data.company ?? prev.company,
        role: data.role ?? prev.role,
        notes: summaryText || prev.notes,
      }))

      setMissing(missingMap)

      setSuccess('Fields filled with AI suggestions.')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(message || 'Smart fill failed')
    } finally {
      setSmartLoading(false)
    }
  }


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
        city: form.city?.trim() ? form.city : null,
        company: form.company,
        role: form.role,
        birthdate: form.birthdate?.trim() ? form.birthdate : null,
        notes: form.notes?.trim() ? form.notes : null,
      }

      const url = isEdit ? `/api/contacts/${initial.id}` : '/api/contacts'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let detail = ''
        try {
          detail = await res.text()
          const parsed = JSON.parse(detail)
          if (res.status === 409) {
            if (parsed?.error?.toLowerCase().includes('email')) {
              setDuplicate({ email: true, phone: false })
              setMissing((m) => ({ ...m, email: true }))
              throw new Error('Duplicate email: already exists')
            }
            if (parsed?.error?.toLowerCase().includes('phone')) {
              setDuplicate({ email: false, phone: true })
              setMissing((m) => ({ ...m, phone: true }))
              throw new Error('Duplicate phone: already exists')
            }
          }
          if (parsed?.error) throw new Error(parsed.error)
        } catch (_) {
          /* fall through */
        }
        throw new Error(detail || 'Request failed')
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
    <form onSubmit={handleSubmit} className="space-y-3 text-sm">
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
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs">
                <p className="label mb-1">Smart Fill (AI)</p>
                <p className="text-xs text-slate-600 leading-snug">
                  Describe the contact (e.g., "Rahul, works at Infosys, React dev, Bangalore").
                </p>
              </div>
              <button
                type="button"
                onClick={handleSmartFill}
                disabled={smartLoading || !smartInput.trim()}
                className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-black/50"
              >
                {smartLoading ? 'Filling...' : 'Smart Fill'}
              </button>
            </div>
            <textarea
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              className="input min-h-20 mt-2 text-sm"
              placeholder="Rahul, works at Infosys, React dev, Bangalore"
            />
          </div>
          <div>
            <label className="label">Birthdate</label>
            <input
              type="date"
              value={form.birthdate}
              onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
              className="input h-9 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input
                value={form.name}
                onChange={(e) => {
                  setMissing((m) => ({ ...m, name: false }))
                  setForm({ ...form, name: e.target.value })
                }}
                className={`input h-9 text-sm ${missing.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Jane Doe"
              />
              {missing.name && <p className="mt-1 text-xs text-red-600">Please fill the name.</p>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Email</label>
                <button
                  type="button"
                  onClick={() => setAutoEmail((v) => !v)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium transition border ${
                    autoEmail ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      autoEmail ? 'bg-white border-white' : 'bg-white border-slate-400'
                    }`}
                  />
                  {autoEmail ? 'Auto-fill ON' : 'Auto-fill OFF'}
                </button>
              </div>
              <input
                value={form.email}
                onChange={(e) => {
                  if (autoEmail) setAutoEmail(false)
                  setMissing((m) => ({ ...m, email: false }))
                  setDuplicate((d) => ({ ...d, email: false }))
                  setForm({ ...form, email: e.target.value })
                }}
                className={`input h-9 text-sm ${
                  missing.email || duplicate.email ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="jane@example.com"
              />
              {duplicate.email && <p className="mt-1 text-xs text-red-600">Duplicate email is not allowed.</p>}
              {!duplicate.email && missing.email && (
                <p className="mt-1 text-xs text-red-600">
                  Enter name + birthdate to auto-fill email, or type it manually.
                </p>
              )}
            </div>
            <div>
              <label className="label">Company</label>
              <input
                value={form.company}
                onChange={(e) => {
                  setMissing((m) => ({ ...m, company: false }))
                  setForm({ ...form, company: e.target.value })
                }}
                className={`input h-9 text-sm ${missing.company ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Infosys"
              />
              {missing.company && <p className="mt-1 text-xs text-red-600">Please fill the company.</p>}
            </div>
            <div>
              <label className="label">Role</label>
              <input
                value={form.role}
                onChange={(e) => {
                  setMissing((m) => ({ ...m, role: false }))
                  setForm({ ...form, role: e.target.value })
                }}
                className={`input h-9 text-sm ${missing.role ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="React Developer"
              />
              {missing.role && <p className="mt-1 text-xs text-red-600">Please fill the role.</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">City</label>
              <input
                value={form.city}
                onChange={(e) => {
                  setMissing((m) => ({ ...m, city: false }))
                  setForm({ ...form, city: e.target.value })
                }}
                className={`input h-9 text-sm ${missing.city ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Bangalore"
              />
              {missing.city && <p className="mt-1 text-xs text-red-600">Please fill the city.</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => {
                  setMissing((m) => ({ ...m, phone: false }))
                  setDuplicate((d) => ({ ...d, phone: false }))
                  setForm({ ...form, phone: e.target.value })
                }}
                className={`input h-9 text-sm ${
                  missing.phone || duplicate.phone ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="+1 555 123 4567"
              />
              {duplicate.phone && <p className="mt-1 text-xs text-red-600">Duplicate phone is not allowed.</p>}
              {!duplicate.phone && missing.phone && (
                <p className="mt-1 text-xs text-red-600">Please fill the phone.</p>
              )}
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input min-h-24 text-sm"
                placeholder="Optional notes…"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
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
