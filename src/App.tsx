import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { NavBar } from '@/components/layout/NavBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { ToastContainer } from '@/components/shared/Toast'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { HomePage } from '@/pages/HomePage'
import { WorkoutPage } from '@/pages/WorkoutPage'
import { WorkoutHomePage } from '@/pages/WorkoutHomePage'
import { CreateRoutinePage } from '@/pages/CreateRoutinePage'
import { AddExercisesToRoutinePage } from '@/pages/AddExercisesToRoutinePage'
import { CreateExercisePage } from '@/pages/CreateExercisePage'
import { ManualEntryPage } from '@/pages/ManualEntryPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ActiveWorkoutPage } from '@/pages/ActiveWorkoutPage'
import { SaveWorkoutPage } from '@/pages/SaveWorkoutPage'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ROUTES } from '@/utils/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="hidden md:block">
        <NavBar />
      </div>
      <PageContainer>{children}</PageContainer>
      <div className="md:hidden">
        <NavBar />
      </div>
    </div>
  )
}

function AppRoutes() {
  const { isLoading, user, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={user ? <Navigate to={ROUTES.HOME} replace /> : <LoginPage />}
      />
      <Route
        path={ROUTES.SIGNUP}
        element={user ? <Navigate to={ROUTES.HOME} replace /> : <SignUpPage />}
      />
      <Route
        path={ROUTES.HOME}
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT}
        element={
          <ProtectedRoute>
            <AppLayout>
              <WorkoutHomePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT_START}
        element={
          <ProtectedRoute>
            <WorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT_ACTIVE}
        element={
          <ProtectedRoute>
            <ActiveWorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT_SAVE}
        element={
          <ProtectedRoute>
            <SaveWorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT_CREATE_ROUTINE}
        element={
          <ProtectedRoute>
            <CreateRoutinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT_ADD_EXERCISES}
        element={
          <ProtectedRoute>
            <AddExercisesToRoutinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.WORKOUT_CREATE_EXERCISE}
        element={
          <ProtectedRoute>
            <CreateExercisePage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MANUAL_ENTRY}
        element={
          <ProtectedRoute>
            <AppLayout>
              <ManualEntryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.HISTORY}
        element={
          <ProtectedRoute>
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.EXERCISES}
        element={
          <ProtectedRoute>
            <AppLayout>
              <ExercisesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
