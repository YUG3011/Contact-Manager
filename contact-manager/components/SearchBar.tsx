"use client"

import React, { useEffect, useRef, useState } from 'react'
import VoiceIcon from './VoiceIcon'
import CancelIcon from './CancelIcon'

export default function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Setup Web Speech API if available
    const w = (window as any)
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const r = new SpeechRecognition()
    r.lang = 'en-US'
    r.interimResults = true
    r.continuous = false

    r.onresult = (ev: any) => {
      const last = ev.results[ev.results.length - 1]
      const text = last[0].transcript
      // if final result, apply lightweight autocorrect
      if (last.isFinal) {
        onChange(simpleAutoCorrect(text))
      } else {
        onChange(text)
      }
    }

    r.onend = () => {
      setListening(false)
    }

    recognitionRef.current = r
    return () => {
      try { r.stop() } catch { }
    }
  }, [onChange])

  function toggleListen() {
    const r = recognitionRef.current
    if (!r) return alert('Voice not supported in this browser')
    if (listening) {
      r.stop()
      setListening(false)
    } else {
      try {
        r.start()
        setListening(true)
      } catch (err) {
        console.error('speech start error', err)
      }
    }
  }

  // Very lightweight, safe autocorrect: common typos and whitespace normalization.
  function simpleAutoCorrect(input: string) {
    if (!input) return input
    let t = input.trim().replace(/\s+/g, ' ')
    const map: Record<string, string> = {
      teh: 'the',
      recieve: 'receive',
      adress: 'address',
      devloper: 'developer',
      manger: 'manager',
      gmaildotcom: 'gmail.com',
      at: 'at',
    }

    // token-level replacements for a few common misspellings
    t = t
      .split(' ')
      .map((tok) => map[tok.toLowerCase()] ?? tok)
      .join(' ')

    // convert spoken forms like ' at ' and ' dot ' inside emails
    t = t.replace(/\s+at\s+/gi, '@').replace(/\s+dot\s+/gi, '.')
    return t
  }

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search contacts..."
        className="w-full input pr-28"
        aria-label="Search contacts"
      />

      <div className="absolute inset-y-0 right-2 flex items-center gap-2">
        {/* Clear button inside input */}
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear"
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Clear search"
        >
          <CancelIcon className="h-4 w-4" />
        </button>

        {/* Voice button inside input */}
        <button
          type="button"
          onClick={toggleListen}
          title="Voice search"
          className={`h-8 px-3 rounded-md flex items-center gap-2 ${listening ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          aria-pressed={listening}
          aria-label="Voice search"
        >
          <VoiceIcon active={listening} className="h-4 w-4" />
          <span className="sr-only">Voice</span>
        </button>
      </div>
    </div>
  )
}
