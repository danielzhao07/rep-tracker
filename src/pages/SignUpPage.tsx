import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { Activity } from 'lucide-react'

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUp, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    await signUp(email, password)
    const { user } = useAuthStore.getState()
    if (user) {
      navigate(ROUTES.HOME)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <Activity className="text-green-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-400 mt-1">Start tracking your workouts</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {displayError}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Repeat password"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
