"use client"

import { useState } from 'react'

export default function DeleteContactButton({ id, onDeleted }: { id: string, onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Delete this contact?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
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
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
