import type { ReactNode } from 'react'

function Credit({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-text-secondary underline decoration-[var(--color-border)] underline-offset-4 hover:text-accent hover:decoration-accent transition-colors"
    >
      {children}
    </a>
  )
}

// Paste a profile URL to turn a placeholder into a live link.
const PROFILES: { name: string; href: string; path: string }[] = [
  {
    name: 'GitHub',
    href: 'https://github.com/aynez322',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    name: 'Spotify',
    href: 'https://open.spotify.com/user/cwnvfdytaxhv7yj3ousab6x1l',
    path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
  },
  {
    name: 'LinkedIn',
    href: '',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    name: 'X',
    href: '',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
]

function ProfileLinks() {
  return (
    <ul className="flex items-center gap-1 -ml-2 sm:ml-auto sm:-mr-2 flex-shrink-0">
      {PROFILES.map(({ name, href, path }) => {
        const icon = (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={path} />
          </svg>
        )
        const base = 'w-10 h-10 rounded-full flex items-center justify-center'
        return (
          <li key={name}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                title={name}
                className={`${base} text-text-secondary hover:text-accent hover:bg-bg-raised transition-colors`}
              >
                {icon}
              </a>
            ) : (
              // no account yet: shown, but not a link
              <span aria-label={`${name} (coming soon)`} title={`${name}: coming soon`} className={`${base} text-text-muted opacity-50`}>
                {icon}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Where the music comes from: credits for the services the results are built on. */
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/favicon.svg" alt="" className="w-5 h-5 rounded-[4px]" />
          <span className="font-display text-text-secondary">Listeners Like Me</span>
        </div>
        <p className="text-text-muted text-sm leading-relaxed max-w-[62ch]">
          Built on what people actually play: listening data from{' '}
          <Credit href="https://www.last.fm">Last.fm</Credit> and{' '}
          <Credit href="https://listenbrainz.org">ListenBrainz</Credit>, songs and 30-second previews
          from <Credit href="https://www.deezer.com">Deezer</Credit>, and sound matching by the{' '}
          <Credit href="https://huggingface.co/laion/clap-htsat-unfused">CLAP</Credit> audio model.
        </p>
        <ProfileLinks />
      </div>
    </footer>
  )
}
