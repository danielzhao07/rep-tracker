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
        'bg-dark-800 rounded-lg border border-dark-700 p-6 transition-all duration-200',
        hover && 'hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/10 transform hover:scale-[1.02] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
