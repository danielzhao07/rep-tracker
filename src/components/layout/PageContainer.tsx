import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <>
      {/* Mobile header with logo */}
      <header className="md:hidden sticky top-0 z-30 bg-dark-900 border-b border-dark-700 px-4 py-4 flex items-center justify-center">
        <img src="/jakd-logo-small.png" alt="JAKD" className="h-20 w-20" style={{ filter: 'invert(1) brightness(2)' }} />
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-6 pb-24 md:py-8 md:pb-8">
        {children}
      </main>
    </>
  )
}
