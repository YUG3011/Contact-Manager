import React from 'react'

export default function VoiceIcon({ active = false, className = 'h-4 w-4' }: { active?: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
        fill={active ? 'currentColor' : 'none'}
      />
      <path
        d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V21a1 1 0 102 0v-3.08A7 7 0 0019 11z"
        strokeWidth={0}
        fill={active ? 'currentColor' : 'currentColor'}
      />
    </svg>
  )
}
