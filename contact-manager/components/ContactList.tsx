"use client"

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import DeleteContactButton from './DeleteContactButton'
import RestoreContactButton from './RestoreContactButton'
import CopyField from './CopyField'

function formatDate(value: any) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function relativeTime(value: any) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  const diff = Date.now() - d.getTime()
  const sec = Math.round(diff / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  if (sec < 60) return `${sec}s ago`
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  return `${day}d ago`
}

function formatRemaining(ms: number) {
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.round(hr / 24)
  return `${day}d`
}

export default function ContactList({
  contacts,
  showFavorite = true,
  onAction,
  isTrash = false,
}: {
  contacts: any[]
  showFavorite?: boolean
  onAction?: (a: any) => void
  isTrash?: boolean
}) {
  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {contacts.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">No contacts yet.</div>
            <div className="flex items-center justify-center gap-3">
              <Link href="/contacts/new" className="btn-primary">
                Add New Contact
              </Link>
              <Link href="/contacts" className="btn-secondary">
                Your Contacts
              </Link>
            </div>
          </div>
        ) : (
          contacts.map((c) => {
            const expiresAtRaw = c?.expiresAt ? new Date(c.expiresAt) : null
            const expiresAt = expiresAtRaw && !Number.isNaN(expiresAtRaw.getTime()) ? expiresAtRaw : null
            const scheduledDelete = Boolean(expiresAt)
            const remaining = expiresAt ? Math.max(0, expiresAt.getTime() - Date.now()) : 0
            const remainingDays = expiresAt ? Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000))) : 0

            return (
              <div
                key={c.id}
                className={`p-5 flex items-center justify-between gap-4 ${
                  scheduledDelete
                    ? isTrash
                      ? 'bg-amber-50/60 dark:bg-amber-900/30 border-l-4 border-amber-300 dark:border-amber-600'
                      : 'bg-amber-50/40 dark:bg-amber-900/20 border-l-4 border-amber-200 dark:border-amber-700/60'
                    : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {c.name}
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-500">{c.email}</span>
                  </div>

                  {/* Updated badge moved to the right side to sit at the bottom-right */}

                  {scheduledDelete && expiresAt ? (
                    <div className="mt-2">
                      <span className="inline-block text-xs font-medium text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        Will be deleted in {remainingDays === 1 ? '1 day' : `${remainingDays} days`}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-2">
                    <CopyField value={c.phone || '—'} copy={Boolean(c.phone)} />
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contacts/${c.id}${isTrash ? '?from=trash' : ''}`}
                      className="btn-secondary shrink-0"
                    >
                      View
                    </Link>
                    <ContactActionsMenu contact={c} onAction={onAction} showFavorite={showFavorite} isTrash={isTrash} />
                  </div>

                  {c.updatedAt ? (
                    <div>
                      <span
                        title={formatDate(c.updatedAt)}
                        className="inline-block text-[11px] font-normal text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"
                      >
                        updated {relativeTime(c.updatedAt)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ContactActionsMenu({
  contact,
  onAction,
  showFavorite = true,
  isTrash = false,
}: {
  contact: any
  onAction?: (a: any) => void
  showFavorite?: boolean
  isTrash?: boolean
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [menuMaxHeight, setMenuMaxHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    function onDocDown(e: any) {
      const target = e.target as Node
      if (btnRef.current && btnRef.current.contains(target)) return
      if (menuRef.current && menuRef.current.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('touchstart', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('touchstart', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function openMenu() {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const menuWidth = 176
      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))
      const top = rect.bottom
      setPos({ top, left })
      setMenuMaxHeight(Math.max(120, window.innerHeight - 48))
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    if (!menuRef.current || !btnRef.current) return
    const raf = requestAnimationFrame(() => {
      const m = menuRef.current!
      const b = btnRef.current!.getBoundingClientRect()
      const menuRect = m.getBoundingClientRect()
      let newTop = pos.top
      let newLeft = pos.left

      if (menuRect.bottom > window.innerHeight - 8) {
        const above = b.top - menuRect.height
        newTop = Math.max(8, above)
      }

      if (menuRect.left < 8) newLeft = 8
      if (menuRect.right > window.innerWidth - 8) newLeft = Math.max(8, window.innerWidth - menuRect.width - 8)
      if (newTop !== pos.top || newLeft !== pos.left) setPos({ top: newTop, left: newLeft })
    })

    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function toggleFavorite() {
    const prev = { favorite: contact.favorite }
    try {
      await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !contact.favorite }),
      })
      onAction?.({ type: 'favorite', id: contact.id, prev })
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert('Failed to update favorite')
    }
  }

  function edit() {
    setOpen(false)
    if (isTrash) {
      alert('Please restore this contact before editing.')
      return
    }
    window.location.href = `/contacts/${contact.id}/edit`
  }

  async function trash() {
    if (isTrash) return
    if (!confirm('Move this contact to trash?')) return
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      onAction?.({ type: 'delete', id: contact.id, prev: contact })
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  async function permanentDelete() {
    if (!confirm('Permanently delete this contact? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/contacts/${contact.id}?force=1`, { method: 'DELETE' })
      if (!res.ok) throw new Error('permanent delete failed')
      onAction?.({ type: 'permanent-delete', id: contact.id, prev: contact })
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert('Permanent delete failed')
    }
  }

  async function restore() {
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'POST' })
      if (!res.ok) throw new Error('restore failed')
      onAction?.({ type: 'restore', id: contact.id, prev: contact })
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert('Restore failed')
    }
  }

  async function setAutoDeleteDefault() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt: d.toISOString() }),
      })
      if (!res.ok) {
        let detail = ''
        try {
          const json = await res.json()
          detail = json?.error || JSON.stringify(json)
        } catch {
          detail = await res.text().catch(() => 'Request failed')
        }
        throw new Error(detail || `Request failed (${res.status})`)
      }
      onAction?.({ type: 'autodelete', id: contact.id, prev: contact })
      setOpen(false)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to set autodelete'
      alert(`Failed to set autodelete: ${message}`)
    }
  }

  async function setAutoDeleteCustom() {
    const inp = prompt('Auto-delete after how many days? Enter a number (e.g. 7)')
    if (!inp) return
    const days = Number(inp)
    if (!Number.isFinite(days) || days <= 0) return alert('Invalid number')
    const d = new Date()
    d.setDate(d.getDate() + Math.floor(days))
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt: d.toISOString() }),
      })
      if (!res.ok) {
        let detail = ''
        try {
          const json = await res.json()
          detail = json?.error || JSON.stringify(json)
        } catch {
          detail = await res.text().catch(() => 'Request failed')
        }
        throw new Error(detail || `Request failed (${res.status})`)
      }
      onAction?.({ type: 'autodelete', id: contact.id, prev: contact })
      setOpen(false)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to set autodelete'
      alert(`Failed to set autodelete: ${message}`)
    }
  }

  async function cancelAutoDelete() {
    if (!confirm('Cancel scheduled auto-delete?')) return
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt: null }),
      })
      if (!res.ok) {
        let detail = ''
        try {
          const json = await res.json()
          detail = json?.error || JSON.stringify(json)
        } catch {
          detail = await res.text().catch(() => 'Request failed')
        }
        throw new Error(detail || `Request failed (${res.status})`)
      }
      onAction?.({ type: 'autodelete-cancel', id: contact.id, prev: contact })
      setOpen(false)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to cancel autodelete'
      alert(`Failed to cancel autodelete: ${message}`)
    }
  }

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        width: 176,
        maxHeight: menuMaxHeight,
        overflowY: 'auto',
      }}
      className="rounded-md border bg-white dark:bg-slate-800 shadow-md z-50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
    >
      <div className="flex flex-col py-1">
        {showFavorite ? (
          <button className="text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={toggleFavorite}>
            {contact.favorite ? 'Unfavorite' : 'Favorite'}
          </button>
        ) : null}

        {isTrash ? (
          <button className="text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={restore}>
            Restore
          </button>
        ) : null}

        <button
          className={`text-left px-3 py-2 ${isTrash ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          onClick={edit}
          title={isTrash ? 'Restore this contact to edit' : undefined}
        >
          Edit
        </button>

        {!isTrash ? (
          <button className="text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={trash}>
            Trash
          </button>
        ) : (
          <button className="text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-700 text-red-600 dark:text-red-300" onClick={permanentDelete}>
            Permanently delete
          </button>
        )}

        <div className="border-t my-1 border-slate-100 dark:border-slate-700" />

        <button className="text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={setAutoDeleteDefault}>
          Auto-delete (1 day)
        </button>
        <button className="text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={setAutoDeleteCustom}>
          Auto-delete (custom days)
        </button>

        {contact?.expiresAt ? (
          <button
            className="text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300"
            onClick={cancelAutoDelete}
          >
            Cancel auto-delete
          </button>
        ) : null}

        {isTrash ? null : null}
      </div>
    </div>
  )

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
        title="Actions"
        type="button"
      >
        ⋯
      </button>
      {open && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  )
}


