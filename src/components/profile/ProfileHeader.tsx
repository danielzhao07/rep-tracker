import { User as UserIcon, Mail } from 'lucide-react'
import { Card } from '@/components/shared/Card'

interface ProfileHeaderProps {
  email: string
  displayName?: string
}

export function ProfileHeader({ email, displayName }: ProfileHeaderProps) {
  // Get initials from email for avatar
  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-green-500">{initials}</span>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">
            {displayName || email.split('@')[0]}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <Mail size={14} />
            <span>{email}</span>
          </div>
        </div>

        {/* User Icon */}
        <UserIcon size={24} className="text-gray-500" />
      </div>
    </Card>
  )
}
