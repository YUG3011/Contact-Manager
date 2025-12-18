"use client"

import { useState } from 'react'

export default function DeleteContactButton({ id, onDeleted, force }: { id: string, onDeleted?: () => void, force?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const message = force ? 'Permanently delete this contact? This cannot be undone.' : 'Delete this contact?'
    if (!window.confirm(message)) return
    setLoading(true)
    try {
      const url = `/api/contacts/${id}` + (force ? '?force=1' : '')
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      if (onDeleted) onDeleted()
      else window.location.reload()
    } catch {
      alert('Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className="btn-secondary shrink-0"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (force ? 'Deleting...' : 'Deleting...') : force ? 'Delete Permanently' : 'Delete'}
    </button>
  )
}
