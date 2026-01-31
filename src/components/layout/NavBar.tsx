import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'
import { Home, Dumbbell, Clock, User, Plus } from 'lucide-react'
import { clsx } from 'clsx'

export function NavBar() {
  const navItems = [
    { to: ROUTES.HOME, icon: Home, label: 'Home', isCenterButton: false },
    { to: ROUTES.HISTORY, icon: Clock, label: 'History', isCenterButton: false },
    { to: ROUTES.WORKOUT_START, icon: Plus, label: '', isCenterButton: true },
    { to: ROUTES.EXERCISES, icon: Dumbbell, label: 'Exercises', isCenterButton: false },
    { to: ROUTES.PROFILE, icon: User, label: 'Profile', isCenterButton: false },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-gray-600 md:relative md:border-t-0 md:border-b z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - only on desktop */}
          <div className="hidden md:flex items-center gap-2 mr-8">
            <img src="/jakd-logo.png" alt="JAKD" className="h-20" style={{ filter: 'invert(1) brightness(2)' }} />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center justify-around flex-1 md:justify-start md:gap-1">
            {navItems.map(({ to, icon: Icon, label, isCenterButton }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors',
                    isCenterButton
                      ? 'relative -mt-8 md:mt-0' // Elevate center button on mobile
                      : 'px-3 py-2 rounded-lg text-xs md:text-sm',
                    isCenterButton && isActive
                      ? ''
                      : isCenterButton
                      ? ''
                      : isActive
                      ? 'text-green-500'
                      : 'text-gray-400 hover:text-white'
                  )
                }
              >
                {isCenterButton ? (
                  // Large circular center button
                  <div className={clsx(
                    'flex items-center justify-center rounded-full transition-all',
                    'w-14 h-14 md:w-10 md:h-10',
                    'bg-green-500 hover:bg-green-600',
                    'shadow-lg shadow-green-500/50'
                  )}>
                    <Icon size={28} className="text-black md:w-5 md:h-5" />
                  </div>
                ) : (
                  <>
                    <Icon size={20} />
                    {label && <span>{label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Desktop spacing - removed sign out button (moved to Profile) */}
          <div className="hidden md:block w-24"></div>
        </div>
      </div>
    </nav>
  )
}
