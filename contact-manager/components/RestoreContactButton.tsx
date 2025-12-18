"use client"

import { useState } from 'react'

export default function RestoreContactButton({ id, onRestored }: { id: string; onRestored?: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleRestore() {
    if (!window.confirm('Restore this contact?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'POST' })
      if (!res.ok) throw new Error('Restore failed')
      if (onRestored) onRestored()
      else window.location.reload()
    } catch {
      alert('Restore failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" className="btn-secondary shrink-0" onClick={handleRestore} disabled={loading}>
      {loading ? 'Restoring...' : 'Restore'}
    </button>
  )
}
