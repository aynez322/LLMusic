interface HeaderProps {
  onHomeClick?: () => void
}

export function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="px-6 py-4 border-b border-[var(--color-border)] bg-bg-surface/60 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 group cursor-pointer bg-transparent border-none p-0"
          aria-label="Go to home"
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-base select-none group-hover:bg-accent-light transition-colors">
            ♪
          </div>
          <div className="text-left">
            <h1 className="gradient-text text-lg font-bold leading-none tracking-tight">LLMusic</h1>
            <p className="text-text-muted text-[10px] mt-0.5 leading-none">AI-Powered Recommendations</p>
          </div>
        </button>
      </div>
    </header>
  )
}
