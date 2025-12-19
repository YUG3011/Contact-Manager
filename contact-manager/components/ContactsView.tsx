"use client"
import React, { useEffect, useMemo, useState } from 'react'
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
  const [city, setCity] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [usingInMemory, setUsingInMemory] = useState(false)
  const [deletedMode] = useState<'exclude' | 'include' | 'only'>(initialDeletedMode)

  const debouncedQ = useDebounced(q, 300)
  const [sort, setSort] = useState<'createdAt' | 'name' | 'lastUsed'>('createdAt')
  const [reloadKey, setReloadKey] = useState(0)
  const [lastAction, setLastAction] = useState<any | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        if (mountedDebug && j?.usingInMemory) setUsingInMemory(true)
      } catch (err) {
        /* ignore */
      }
    }

    async function fetchContacts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedQ) params.set('q', debouncedQ)
        if (city) params.set('city', city)
        if (company) params.set('company', company)
        if (role) params.set('role', role)
        if (sort) params.set('sort', sort)
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

    fetchDebug()
    fetchContacts()

    // Refetch when window regains focus or tab becomes visible
    function onFocus() {
      setReloadKey((k) => k + 1)
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') setReloadKey((k) => k + 1)
    }
    function onPopState() {
      // browser back/forward navigation - refresh the list
      setReloadKey((k) => k + 1)
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('popstate', onPopState)

    return () => {
      mounted = false
      mountedDebug = false
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('popstate', onPopState)
    }
  }, [debouncedQ, city, company, role, sort, reloadKey, deletedMode])

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

    let raf = 0
    function updateActive() {
      // pick the letter whose section header is closest to the top offset
      const offset = 120 // header + some padding
      let best: string | null = null
      let bestDistance = Infinity
      lettersWithContacts.forEach((l) => {
        const el = document.getElementById(`letter-${l}`)
        if (!el) return
        const rect = el.getBoundingClientRect()
        const distance = Math.abs(rect.top - offset)
        if (distance < bestDistance) {
          bestDistance = distance
          best = l
        }
      })
      if (best) setActiveLetter(best)
    }

    function onScroll() {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateActive)
    }

    // initial check and listeners
    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [lettersWithContacts])

  const allowFavorites = deletedMode !== 'only'

  const toastTimeoutRef = { current: null as number | null }
  const TOAST_DURATION = 3000

  function clearToastTimer() {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
  }

  function startToastTimer() {
    clearToastTimer()
    toastTimeoutRef.current = window.setTimeout(() => setLastAction(null), TOAST_DURATION)
  }

  useEffect(() => {
    if (!lastAction) return
    startToastTimer()
    setReloadKey((k) => k + 1)
    return () => clearToastTimer()
  }, [lastAction])

  // Check URL for `?updated=1` (or created) to show a success toast and refetch once.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.has('updated') || params.has('created')) {
      const msg = params.has('updated') ? 'Contact updated' : 'Contact created'
      setSuccessMessage(msg)
      // trigger refetch
      setReloadKey((k) => k + 1)

      // remove the query params so toast doesn't show repeatedly
      params.delete('updated')
      params.delete('created')
      params.delete('id')
      const newSearch = params.toString()
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '')
      try {
        history.replaceState(null, '', newUrl)
      } catch (err) {
        /* ignore */
      }

      // auto-hide the toast after the same TOAST_DURATION
      const t = window.setTimeout(() => setSuccessMessage(null), TOAST_DURATION)
      return () => clearTimeout(t)
    }
  }, [])

  async function handleUndo() {
    if (!lastAction) return
    try {
      if (lastAction.type === 'delete') {
        await fetch(`/api/contacts/${lastAction.id}`, { method: 'POST' })
      } else if (lastAction.type === 'favorite') {
        await fetch(`/api/contacts/${lastAction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorite: lastAction.prev.favorite }),
        })
      } else if (lastAction.type === 'autodelete') {
        // undo scheduled auto-delete by clearing expiresAt
        await fetch(`/api/contacts/${lastAction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresAt: null }),
        })
      } else if (lastAction.type === 'autodelete-cancel') {
        // undo cancel by restoring previous expiresAt (if any)
        const prevExpiresAt = lastAction?.prev?.expiresAt
        await fetch(`/api/contacts/${lastAction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresAt: prevExpiresAt ?? null }),
        })
      }
      setReloadKey((k) => k + 1)
      setLastAction(null)
    } catch (err) {
      console.error(err)
      alert('Undo failed')
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {usingInMemory && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
            Warning: No `DATABASE_URL` configured — app is using an in-memory fallback.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 w-full">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts..." className="w-full input" />
            <div className="hidden sm:flex items-center gap-2">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="input w-36">
                <option value="">City</option>
                {options.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select value={company} onChange={(e) => setCompany(e.target.value)} className="input w-36">
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

              {/* Sort select removed per request */}
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
                    <ContactList contacts={favorites} showFavorite={allowFavorites} onAction={(a: any) => setLastAction(a)} isTrash={(deletedMode as any) === 'only'} />
                  </div>
                )}

                {contacts.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">No contacts yet.</div>
                    <div className="flex items-center justify-center gap-3">
                      <a href="/contacts/new" className="btn-primary">
                        Add New Contact
                      </a>
                      <a href="/contacts" className="btn-secondary">
                        Your Contacts
                      </a>
                    </div>
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
                      <ContactList contacts={group} showFavorite={allowFavorites} onAction={(a: any) => setLastAction(a)} isTrash={(deletedMode as any) === 'only'} />
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
                            aria-label={`Jump to ${l}`}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-sm font-medium select-none ${
                              activeLetter === l
                                ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                                : 'text-slate-400 hover:text-slate-700 dark:text-slate-400/80 dark:hover:text-slate-200'
                            }`}
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

        {lastAction ? (
          <div className="fixed bottom-6 right-6 z-40 w-[320px] max-w-[90%] rounded-lg border bg-slate-950 text-white border-slate-900 p-3 shadow-lg backdrop-blur-sm dark:bg-slate-800/95 dark:border-slate-700 dark:text-slate-100">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                {lastAction.type === 'delete' && 'Contact moved to trash'}
                {lastAction.type === 'favorite' && 'Favorite updated'}
                {lastAction.type === 'autodelete' && 'Auto-delete scheduled'}
                {lastAction.type === 'autodelete-cancel' && 'Auto-delete canceled'}
                {lastAction.type === 'restore' && 'Contact restored'}
                {lastAction.type === 'permanent-delete' && 'Contact permanently deleted'}
                {!['delete', 'favorite', 'autodelete', 'autodelete-cancel', 'restore', 'permanent-delete'].includes(lastAction.type) && 'Action performed'}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleUndo} className="btn bg-white text-slate-950 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600">
                  Undo
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="fixed bottom-20 right-6 z-40 w-[260px] max-w-[90%] rounded-lg border bg-emerald-50/95 dark:bg-emerald-900/80 dark:border-emerald-800 border-emerald-200 p-3 shadow-lg text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">{successMessage}</div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}