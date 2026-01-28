import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { Home, Dumbbell, Clock, BarChart3, LogOut } from 'lucide-react'
import { clsx } from 'clsx'

export function NavBar() {
  const { signOut } = useAuthStore()

  const navItems = [
    { to: ROUTES.HOME, icon: Home, label: 'Home' },
    { to: ROUTES.HISTORY, icon: Clock, label: 'History' },
    { to: ROUTES.ANALYTICS, icon: BarChart3, label: 'Analytics' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-gray-600 md:relative md:border-t-0 md:border-b z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="hidden md:flex items-center gap-1 mr-8">
            <Dumbbell className="text-green-500" size={24} />
            <span className="font-semibold text-lg">Rep Tracker</span>
          </div>

          <div className="flex items-center justify-around flex-1 md:justify-start md:gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg text-xs md:text-sm transition-colors',
                    isActive
                      ? 'text-green-500'
                      : 'text-gray-400 hover:text-white'
                  )
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <button
            onClick={signOut}
            className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
