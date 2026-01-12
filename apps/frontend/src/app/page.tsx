'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/AuthGuard'
import { isSuperAdmin } from '@/lib/permissions'

function HomeContent() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Redirect to workspaces if SUPERADMIN, otherwise redirect to a default page
    if (isSuperAdmin(user?.role)) {
      router.replace('/workspaces')
    } else {
      // For ADMIN users, redirect to workflows or sessions
      router.replace('/workflows')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  )
}

