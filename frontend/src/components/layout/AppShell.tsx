import { type ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  themeToggle?: ReactNode
  footer?: ReactNode
}

export function AppShell({ children, themeToggle, footer }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-bg-base flex flex-col transition-colors duration-[250ms]">
      {themeToggle && (
        // phones: scrolls away with the page so it never covers content below
        <div className="absolute sm:fixed top-4 right-4 z-40">
          {themeToggle}
        </div>
      )}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {children}
      </main>
      {footer}
    </div>
  )
}
