import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { ROUTES } from '@/utils/constants'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}
