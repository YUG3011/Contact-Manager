"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  // Render a static placeholder initially to avoid hydration attribute
  // mismatches between server and client. After mount, read the stored
  // preference and render the interactive toggle.
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem('theme')
      if (s === 'light' || s === 'dark') setTheme(s)
    } catch {}
    setMounted(true)
  }, [])

  useEffect(() => {
    // keep document class in sync after mount only
    if (!mounted) return
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme, mounted])

  function toggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  // Until mounted, render a non-interactive placeholder matching the
  // server HTML. This prevents React from seeing different attributes
  // during hydration.
  if (!mounted) {
    return (
      <button aria-hidden className={`relative inline-flex items-center h-8 w-14 rounded-full ${'bg-slate-700'}`}>
        <span className={`absolute left-1 inline-flex h-6 w-6 transform rounded-full bg-white`} />
      </button>
    )
  }

  return (
    <button
      aria-label="Toggle theme"
      role="switch"
      aria-checked={theme === 'dark'}
      onClick={toggle}
      className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute left-1 inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white text-xs transition-transform ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
