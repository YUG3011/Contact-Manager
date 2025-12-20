import React from 'react'

export default function CancelIcon({ className = 'h-4 w-4', title = 'Clear' }: { className?: string; title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={title}
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  )
}
