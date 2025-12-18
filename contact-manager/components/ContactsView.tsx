"use client"
import { useEffect, useMemo, useState } from 'react'
import ContactList from './ContactList'

function useDebounced(value: string, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function ContactsView({ initial = [], initialDeletedMode = 'exclude' }: { initial?: any[]; initialDeletedMode?: 'exclude' | 'include' | 'only' }) {
  const [contacts, setContacts] = useState<any[]>(initial)
  const [q, setQ] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [usingInMemory, setUsingInMemory] = useState(false)
  const [deletedMode] = useState<'exclude' | 'include' | 'only'>(initialDeletedMode)

  const debouncedQ = useDebounced(q, 300)

  // derive filter options from current contacts (cheap for small sets)
  const options = useMemo(() => {
    const companies = Array.from(new Set(contacts.map((c) => c.company).filter(Boolean)))
    const roles = Array.from(new Set(contacts.map((c) => c.role).filter(Boolean)))
    const cities = Array.from(new Set(contacts.map((c) => c.city).filter(Boolean)))
    return { companies, roles, cities }
  }, [contacts])

  useEffect(() => {
    let mounted = true
    let mountedDebug = true
    async function fetchDebug() {
      try {
        const res = await fetch('/api/debug')
        if (!res.ok) return
        const j = await res.json()
        if (mountedDebug && j?.usingInMemory) {
          // show banner
          setUsingInMemory(true)
        }
      } catch (err) {}
    }
    fetchDebug()
    async function fetchContacts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedQ) params.set('q', debouncedQ)
        if (company) params.set('company', company)
        if (role) params.set('role', role)
        if (city) params.set('city', city)
        // deletedMode controls which records to fetch
        if (deletedMode === 'include') params.set('showDeleted', '1')
        if (deletedMode === 'only') params.set('showDeleted', 'only')
        const res = await fetch(`/api/contacts?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (mounted) setContacts(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchContacts()
    return () => {
      mounted = false
      mountedDebug = false
    }
  }, [debouncedQ, company, role, city])



  return (
    <div className="grid gap-4">
      {usingInMemory && (
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
          Warning: No `DATABASE_URL` configured — app is using an in-memory fallback. Set `DATABASE_URL` in
          your environment (Vercel Settings → Environment Variables) to use MongoDB Atlas.
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 w-full">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search contacts by name, email, phone, company, role, city..."
            className="w-full input"
          />
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input w-40"
            >
              <option value="">Company</option>
              {options.companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input w-36">
              <option value="">Role</option>
              {options.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input w-36"
            >
              <option value="">City</option>
              {options.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">&nbsp;</div>
      </div>

      <div>{loading ? <div className="p-4 text-sm text-slate-500">Loading…</div> : <ContactList contacts={contacts} />}</div>
    </div>
  )
}
