import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await signIn(email, password)
    const { user } = useAuthStore.getState()
    if (user) {
      navigate(ROUTES.HOME)
    }
  }

  const handleGoogleSignIn = async () => {
    clearError()
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-8">
        <div className="max-w-sm w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img 
              src="/jakd-logo.png" 
              alt="JAKD" 
              className="h-10 drop-shadow-[0_0_10px_#06b6d4aa]" 
              style={{ filter: 'invert(1) brightness(2)' }} 
            />
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white italic mb-1">Welcome back</h1>
            <p className="text-gray-400 text-sm">Login to continue tracking your workouts</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-dark-800/50 border border-dark-600 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-dark-800/50 border border-dark-600 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  rememberMe 
                    ? 'bg-cyan-500 border-cyan-500' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-gray-400">Remember me for 30 days</span>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
              size="lg"
            >
              Login →
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-xs text-gray-500">or continue with</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-dark-800/50 border border-dark-600 rounded-lg py-2.5 text-sm text-white font-medium hover:bg-dark-700 hover:border-dark-500 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Sign up link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link
              to={ROUTES.SIGNUP}
              className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
            >
              Signup
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-dark-900 to-dark-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-cyan-500/10 blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative text-center px-8">
          {/* Logo */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 opacity-20 blur-xl" />
            <div className="relative w-full h-full rounded-full border border-cyan-500/30 flex items-center justify-center">
              <img 
                src="/jakd-logo.png" 
                alt="JAKD" 
                className="h-12 drop-shadow-[0_0_15px_#06b6d4aa]" 
                style={{ filter: 'invert(1) brightness(2)' }} 
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Track Your Progress</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Professional-grade workout tracking and analysis to help you achieve your fitness goals
          </p>
        </div>
      </div>
    </div>
  )
}
