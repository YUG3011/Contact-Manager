"use client"
import React, { useMemo, useState } from 'react'

export default function SearchExamples({ onSelect }: { onSelect: (q: string) => void }) {
  const [open, setOpen] = useState(false)

  const examples = useMemo(
    () => [
      {
        title: 'Time-based',
        queries: ['people I updated last week', 'contacts edited today', 'recently added contacts'],
      },
      {
        title: 'Company / Work',
        queries: ['contacts from tcs company', 'people working at TCS', 'people working at Google'],
      },
      {
        title: 'Field-based',
        queries: ['contacts from Mumbai', 'contacts in dubai', 'people with email'],
      },
      {
        title: 'Combined',
        queries: [
          'contacts updated last week from google company',
          'recent google company contacts from Rajkot',
          'people I edited yesterday from Mumbai',
        ],
      },
    ],
    []
  )

  return (
    <div className="mt-3 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-expanded={open}
      >
        {open ? 'Hide example searches' : 'Show example searches'}
      </button>

      {open ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {examples.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-200">{group.title}</div>
              <div className="flex flex-col gap-2">
                {group.queries.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSelect(q)}
                    className="text-left text-sm rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title={`Use: ${q}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
