import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, hasSeenOnboarding } = useAuthStore()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    // If user hasn't seen onboarding, redirect there first
    if (!hasSeenOnboarding) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
