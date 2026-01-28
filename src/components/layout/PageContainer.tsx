import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {children}
    </main>
  )
}
