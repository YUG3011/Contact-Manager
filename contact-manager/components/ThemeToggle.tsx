"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
      return (stored as 'light' | 'dark') || 'light'
    } catch {
      return 'light'
    }
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    // mark mounted so we only render theme-dependent text after hydration
    setMounted(true)
  }, [])

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-sm"
      aria-label="Toggle theme"
    >
      {mounted ? (theme === 'dark' ? 'Dark' : 'Light') : <span className="w-6 h-3 inline-block" />}
    </button>
  )
}
