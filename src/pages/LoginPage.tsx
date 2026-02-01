import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await signIn(email, password)
    const { user } = useAuthStore.getState()
    if (user) {
      navigate(ROUTES.HOME)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0f172a] via-[#0a192f] to-[#0e2235]">
      <div className="w-full max-w-md rounded-2xl bg-dark-900 border border-cyan-700/60 shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="320" cy="80" r="120" fill="#06b6d4" fillOpacity="0.08" />
            <circle cx="80" cy="320" r="100" fill="#06b6d4" fillOpacity="0.06" />
          </svg>
        </div>
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/jakd-logo.png" alt="JAKD" className="h-32 drop-shadow-[0_0_16px_#06b6d4cc]" style={{ filter: 'invert(1) brightness(2)' }} />
          </div>
          <p className="text-cyan-400 mt-1 font-medium tracking-wide">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-cyan-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-800 border border-cyan-700/40 rounded-lg px-4 py-2.5 text-white placeholder-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-[0_0_0_2px_#0891b233]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-cyan-300 mb-1.5"
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
              className="w-full bg-dark-800 border border-cyan-700/40 rounded-lg px-4 py-2.5 text-white placeholder-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-[0_0_0_2px_#0891b233]"
              placeholder="Min 6 characters"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-cyan-700/30 shadow-lg border-0"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-cyan-400 mt-6 relative z-10">
          Don't have an account?{' '}
          <Link
            to={ROUTES.SIGNUP}
            className="text-cyan-300 hover:text-cyan-200 transition-colors font-semibold"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
