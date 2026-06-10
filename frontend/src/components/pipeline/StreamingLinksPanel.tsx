import { useState } from 'react'
import { motion } from 'framer-motion'

interface StreamingLinksPanelProps {
  title: string
  artist: string
}

const PLATFORMS = [
  {
    key: 'spotify',
    label: 'Spotify',
    brand: '#1DB954',
    url: (t: string, a: string) =>
      `https://open.spotify.com/search/${encodeURIComponent(`${a} ${t}`)}`,
    Icon: () => (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 01-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257C14.4 12.3 11.158 11.95 7.244 12.99a.779.779 0 01-.412-1.502c4.354-1.194 8.08-.607 11.22 1.141a.781.781 0 01.257 1.073zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.543-1.79c3.532-1.073 9.404-.866 13.115 1.338a.935.935 0 01-.954 1.608z"/>
      </svg>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube Music',
    brand: '#FF0000',
    url: (t: string, a: string) =>
      `https://music.youtube.com/search?q=${encodeURIComponent(`${a} ${t}`)}`,
    Icon: () => (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
        <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
      </svg>
    ),
  },
  {
    key: 'apple',
    label: 'Apple Music',
    brand: '#FC3C44',
    url: (t: string, a: string) =>
      `https://music.apple.com/search?term=${encodeURIComponent(`${a} ${t}`)}`,
    Icon: () => (
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
        <path d="M23.997 6.124a.75.75 0 00-.733-.726l-8.25-.498a.75.75 0 00-.791.691L14 9.417a.75.75 0 00.72.78l.03.001 5.987.362-.063 5.144a2.917 2.917 0 00-1.04-.19c-1.68 0-3.046 1.173-3.046 2.62 0 1.446 1.365 2.619 3.046 2.619 1.68 0 3.046-1.173 3.046-2.62l.001-.034.25-11.975zM9.5 3.25A3.254 3.254 0 006.25 0 3.254 3.254 0 003 3.25c0 1.193.648 2.235 1.61 2.799L3.25 17.5c0 1.518 1.343 2.75 3 2.75s3-1.232 3-2.75L7.888 6.05A3.245 3.245 0 009.5 3.25z"/>
      </svg>
    ),
  },
]

function PlatformRow({
  title,
  artist,
  platform,
}: {
  title: string
  artist: string
  platform: typeof PLATFORMS[number]
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={platform.url(title, artist)}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 no-underline"
      style={{ textDecoration: 'none' }}
    >
      {/* icon — mirrors AgentStep's w-5 flex justify-center */}
      <div className="w-5 flex items-center justify-center flex-shrink-0">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
          style={{
            backgroundColor: hovered ? `${platform.brand}18` : 'var(--color-bg-raised)',
            border: `1px solid ${hovered ? platform.brand + '55' : 'var(--color-border)'}`,
            color: hovered ? platform.brand : 'var(--color-text-muted)',
          }}
        >
          <platform.Icon />
        </div>
      </div>

      <span
        className="flex-1 text-sm transition-colors duration-150"
        style={{ color: hovered ? platform.brand : 'var(--color-text-secondary)' }}
      >
        {platform.label}
      </span>

      <span
        className="text-[10px] font-medium transition-colors duration-150"
        style={{ color: hovered ? platform.brand : 'var(--color-text-muted)' }}
      >
        ↗
      </span>
    </a>
  )
}

export function StreamingLinksPanel({ title, artist }: StreamingLinksPanelProps) {
  if (!title || !artist) return null

  return (
    <motion.div
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-5 card-glow"
    >
      <p className="text-text-muted text-[10px] uppercase tracking-widest mb-4 font-medium">
        Listen On
      </p>
      <div className="flex flex-col gap-4">
        {PLATFORMS.map(p => (
          <PlatformRow key={p.key} title={title} artist={artist} platform={p} />
        ))}
      </div>
    </motion.div>
  )
}
