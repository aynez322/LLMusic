import { type ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  themeToggle?: ReactNode
}

export function AppShell({ children, themeToggle }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col transition-colors duration-250">
      {themeToggle && (
        <div className="fixed top-4 right-4 z-50">
          {themeToggle}
        </div>
      )}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {children}
      </main>
    </div>
  )
}
