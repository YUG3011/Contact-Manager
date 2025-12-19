"use client"

import React, { useEffect, useRef, useState } from 'react'

export default function FeatureList({ items }: { items: string[] }) {
  const n = items.length
  const half = Math.ceil(n / 2)
  const leftItems = items.slice(0, half)
  const rightItems = items.slice(half)

  const [leftDisplay, setLeftDisplay] = useState<string[]>(() => leftItems.map(() => ''))
  const [rightDisplay, setRightDisplay] = useState<string[]>(() => rightItems.map(() => ''))
  const mountedRef = useRef(false)
  const typingIndexRef = useRef<number>(-1)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const charDelay = 30
    const itemDelay = 250

    let combined = [...leftItems, ...rightItems]
    let index = 0

    function typeNextItem() {
      if (index >= combined.length) return
      const text = combined[index]
      typingIndexRef.current = index
      let pos = 0

      function tick() {
        pos += 1
        const partial = text.slice(0, pos)
        if (index < leftItems.length) {
          setLeftDisplay((prev) => {
            const copy = prev.slice()
            // if we're at the end, set the full text explicitly
            copy[index] = pos >= text.length ? text : partial
            return copy
          })
        } else {
          const rightIndex = index - leftItems.length
          setRightDisplay((prev) => {
            const copy = prev.slice()
            copy[rightIndex] = pos >= text.length ? text : partial
            return copy
          })
        }

        if (pos < text.length) {
          setTimeout(tick, charDelay)
        } else {
          index += 1
          typingIndexRef.current = index
          setTimeout(typeNextItem, itemDelay)
        }
      }

      tick()
    }

    typeNextItem()
  }, [leftItems, rightItems])

  function normalize(s: string) {
    return (s ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/\u2011/g, '-')
      .replace(/\u2013|\u2014/g, '-')
      .replace(/\u2018|\u2019/g, "'")
      .replace(/\u201C|\u201D/g, '"')
      .trimEnd()
  }

  function renderColumn(columnItems: string[], display: string[], baseIndex: number) {
    return (
      <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
        {columnItems.map((it, i) => {
          const shown = display[i] ?? ''
          const done = normalize(shown) === normalize(it)

          const absoluteIndex = baseIndex + i

          const showCaret = !done && typingIndexRef.current === absoluteIndex

          return (
            <li key={i}>
              <span
                className={
                  'whitespace-normal break-words inline' +
                  (done ? ' text-black dark:text-white' : '')
                }
              >
                {shown}
                {showCaret ? <span className="caret-blink">|</span> : null}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {renderColumn(leftItems, leftDisplay, 0)}
      {renderColumn(rightItems, rightDisplay, leftItems.length)}

      <style jsx>{`
        .caret-blink {
          display: inline-block;
          width: 10px;
          margin-left: 2px;
          color: currentColor;
          animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
          to { opacity: 0 }
        }
      `}</style>
    </div>
  )
}
