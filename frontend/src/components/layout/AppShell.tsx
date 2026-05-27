interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {children}
      </main>
    </div>
  )
}
