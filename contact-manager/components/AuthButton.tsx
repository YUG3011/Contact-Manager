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
        className="px-3 py-1 bg-blue-600 text-white rounded"
      >
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{session.user?.name ?? session.user?.email}</span>
      <button
        onClick={() => signOut()}
        className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
      >
        Sign out
      </button>
    </div>
  )
}
