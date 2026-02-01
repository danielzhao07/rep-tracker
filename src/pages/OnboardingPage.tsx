import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const slides = [
  {
    title: 'Your All-In-One',
    highlight: 'Gym Trainer',
    description: 'Track every rep, every set, and every workout with precision. Your personal fitness journey starts here.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'AI-Powered',
    highlight: 'Rep Detection',
    description: 'Use your camera to automatically count reps with real-time pose detection. No more losing count mid-set.',
    gradient: 'from-emerald-500 to-cyan-600',
  },
  {
    title: 'Set Goals &',
    highlight: 'Crush Them',
    description: 'Track your progress, set personal records, and watch yourself get stronger every day.',
    gradient: 'from-purple-500 to-pink-600',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setHasSeenOnboarding } = useAuthStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const handleGetStarted = () => {
    setHasSeenOnboarding(true)
    navigate('/login')
  }

  const handleDotClick = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const slide = slides[currentSlide]

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r ${slide.gradient} opacity-10 blur-3xl transition-all duration-1000`} />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Top decorative circles */}
      <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden opacity-30">
        <div className="absolute top-6 left-6 w-20 h-20 border border-cyan-500/30 rounded-full" />
        <div className="absolute top-12 right-12 w-32 h-32 border border-cyan-500/20 rounded-full" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/jakd-logo.png" 
            alt="JAKD" 
            className="h-20 drop-shadow-[0_0_20px_#06b6d4aa]" 
            style={{ filter: 'invert(1) brightness(2)' }} 
          />
        </div>

        {/* Title and description */}
        <div className="text-center max-w-md transition-all duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {slide.title}
          </h1>
          <h2 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent mb-4`}>
            {slide.highlight}
          </h2>
          <p className="text-gray-400 text-base leading-relaxed px-4">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 px-6 pb-8">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'w-6 h-2 bg-cyan-400'
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Get Started button */}
        <button
          onClick={handleGetStarted}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold text-base flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/20"
        >
          Get Started
          <ChevronRight size={20} />
        </button>

        {/* Already have account link */}
        <p className="text-center mt-4 text-gray-500 text-sm">
          Already have an account?{' '}
          <button
            onClick={() => {
              setHasSeenOnboarding(true)
              navigate('/login')
            }}
            className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}
