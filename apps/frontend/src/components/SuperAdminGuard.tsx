'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isSuperAdmin } from '@/lib/permissions'
import { AuthGuard } from './AuthGuard'

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !isSuperAdmin(user.role)) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isSuperAdmin(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h1>
          <p className="text-gray-400 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-black rounded hover:bg-primary/80 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function SuperAdminGuardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SuperAdminGuard>{children}</SuperAdminGuard>
    </AuthGuard>
  )
}

