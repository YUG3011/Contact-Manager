"use client"
import { signIn, signOut, useSession } from 'next-auth/react'
import React from 'react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') return null

  if (!session) {
    return (
      <button
        onClick={() => signIn('github')}
        className="btn-primary"
      >
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-slate-700 sm:block">
        {session.user?.name ?? session.user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="btn-secondary"
      >
        Sign out
      </button>
    </div>
  )
}
