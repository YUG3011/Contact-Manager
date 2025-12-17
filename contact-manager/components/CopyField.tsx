"use client"

import { useState } from 'react'

export default function CopyField({
  value,
  copy = true,
}: {
  value: string
  copy?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0 text-sm text-slate-900 break-all">{value}</div>
      {copy && (
        <button type="button" onClick={onCopy} className="btn-secondary px-3 py-1.5">
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  )
}
