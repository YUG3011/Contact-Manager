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

  const favorites = useMemo(() => contacts.filter((c) => c.favorite), [contacts])

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

  // Alphabet grouping (A-Z). We'll display only letters that have contacts.
  const ALPHABET = useMemo(() => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), [])

  const groups = useMemo(() => {
    const map: Record<string, any[]> = {}
    ALPHABET.forEach((l) => (map[l] = []))
    const all = contacts.slice()
    all
      .sort((a, b) => (a.name || '').toString().localeCompare((b.name || '').toString()))
      .forEach((c) => {
        const ch = (c.name || '').toString().trim().charAt(0).toUpperCase()
        if (ALPHABET.includes(ch)) map[ch].push(c)
      })
    return map
  }, [contacts, ALPHABET])

  const lettersWithContacts = useMemo(() => ALPHABET.filter((l) => (groups[l] || []).length > 0), [ALPHABET, groups])

  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  function scrollToLetter(letter: string) {
    const el = document.getElementById(`letter-${letter}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveLetter(letter)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const obs = new IntersectionObserver(
      (entries) => {
        let best: any = null
        let bestRatio = 0
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            best = entry
          }
        })
        if (best?.target && best?.target.id) {
          const m = best.target.id.match(/^letter-(.)/)
          if (m) setActiveLetter(m[1])
        }
      },
      { root: null, rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    lettersWithContacts.forEach((l) => {
      const el = document.getElementById(`letter-${l}`)
      if (el) obs.observe(el)
    })

    return () => obs.disconnect()
  }, [lettersWithContacts])

  const allowFavorites = deletedMode !== 'only'



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

      <div className="relative">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_64px] gap-6">
            <div>
              {allowFavorites && favorites.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Favorites</div>
                  <ContactList contacts={favorites} showFavorite={allowFavorites} />
                </div>
              )}

              {ALPHABET.map((letter) => {
                const group = groups[letter]
                if (!group || group.length === 0) return null
                return (
                  <div key={letter} id={`letter-${letter}`} className="mb-6">
                        <div className="sticky top-20 z-10 py-2">
                          <div className="inline-block px-3 py-1 rounded-md bg-slate-50 border border-slate-100 shadow-sm">
                            <div className="text-sm font-semibold text-slate-700">{letter}</div>
                          </div>
                        </div>
                    <ContactList contacts={group} showFavorite={allowFavorites} />
                  </div>
                )
              })}
            </div>

            <div className="hidden lg:flex flex-col items-center gap-2 pr-2">
              <div className="sticky top-24">
                <div className="flex flex-col items-center gap-1">
                  {lettersWithContacts.map((l) => (
                    <button
                      key={l}
                      onClick={() => scrollToLetter(l)}
                      className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                        activeLetter === l
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                      title={l}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
