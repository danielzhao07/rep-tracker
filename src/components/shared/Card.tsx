import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export function Card({ children, hover, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-dark-800 rounded-lg border border-gray-600 p-6',
        hover && 'hover:border-green-500 transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
