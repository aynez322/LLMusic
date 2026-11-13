import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppShell } from './components/layout/AppShell'
import { SearchBar } from './components/search/SearchBar'
import { SongNotFound } from './components/search/SongNotFound'
import { SeedCard } from './components/song/SeedCard'
import { RecommendationList } from './components/recommendations/RecommendationList'
import { StageProgress } from './components/pipeline/StageProgress'
import { useRecommendStream } from './hooks/useRecommendStream'
import { stopPreview } from './hooks/usePreviewPlayer'
import { useTheme } from './hooks/useTheme'
import { TopTracksCarousel } from './components/home/TopTracksCarousel'
import { HowItWorks } from './components/home/HowItWorks'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { ErrorBanner } from './components/ui/ErrorBanner'
import { scrollBehavior } from './lib/media'
import type { Track } from './types/music'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const stream = useRecommendStream()

  const [searchKey, setSearchKey]     = useState(0)
  const [discovery, setDiscovery]     = useState(0.5)
  const [lastQuery, setLastQuery]     = useState<{ title: string; artist: string } | null>(null)

  const started   = lastQuery !== null
  const notFound  = started && !stream.seed && !!stream.error
  const showHome  = !started

  function recommendFromTrack(track: Track) {
    stopPreview()
    setLastQuery({ title: track.title, artist: track.artist })
    stream.start({ deezerId: track.deezer_id, discovery })
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  }

  function recommendFromText(title: string, artist: string) {
    stopPreview()
    setLastQuery({ title, artist })
    stream.start({ title, artist, discovery })
  }

  function handleReset() {
    stopPreview()
    stream.reset()
    setLastQuery(null)
    setSearchKey(k => k + 1)
    // "Start over" sits at the bottom of a long list; home starts at the top
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  }

  return (
    <AppShell themeToggle={<ThemeToggle theme={theme} onToggle={toggleTheme} />}>

      {/* ── Hero ─────────────────────────────────────────── */}
      {/* popLayout takes the leaving hero out of the flow at once, so the
          search bar can start gliding up immediately instead of jumping
          when the fade ends */}
      <AnimatePresence mode="popLayout">
        {showHome && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, transition: { duration: 0.12 } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-center mb-10 mt-10"
          >
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <img
                src="/favicon.svg"
                alt="LLMusic"
                className="w-9 h-9 select-none"
                style={{ boxShadow: '0 4px 20px rgba(212,105,42,0.45)', borderRadius: '7px' }}
              />
              <div className="text-left leading-none">
                <span className="font-display text-text-secondary text-xl tracking-wide">Listeners Like Me</span>
              </div>
            </div>

            <h1 className="gradient-text text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Discover Your Sound
            </h1>
            <p className="text-text-secondary text-base mt-3 max-w-md mx-auto leading-relaxed">
              Enter a song you love. We find what its listeners also play, then listen to each one
              to keep the songs that really sound alike.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search ───────────────────────────────────────── */}
      {/* the one orchestrated move: the search bar travels between its home
          and results positions ("position" only, so the inputs don't stretch) */}
      <motion.div
        layout="position"
        transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
        className={showHome ? 'max-w-2xl mx-auto' : 'mb-6'}
      >
        <SearchBar
          key={searchKey}
          onPick={recommendFromTrack}
          onSubmit={recommendFromText}
          discovery={discovery}
          onDiscoveryChange={setDiscovery}
          loading={stream.running}
        />
      </motion.div>

      {/* ── Song not found ───────────────────────────────── */}
      <AnimatePresence>
        {notFound && lastQuery && (
          <SongNotFound
            key="not-found"
            title={lastQuery.title}
            artist={lastQuery.artist}
            message={stream.error ?? ''}
            suggestions={stream.suggestions}
            onDismiss={handleReset}
            onSuggestionSelect={recommendFromTrack}
          />
        )}
      </AnimatePresence>

      {/* ── Home: chart + how it works ───────────────────── */}
      <AnimatePresence mode="popLayout">
        {showHome && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TopTracksCarousel onSelect={recommendFromTrack} />
            <HowItWorks />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────── */}
      <AnimatePresence>
        {started && !notFound && (
          <motion.div
            key="results"
            // wait for the search bar to mostly arrive, so it never slides over them
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {stream.seed
                  ? <SeedCard track={stream.seed} />
                  : <div className="h-full min-h-40 rounded-2xl bg-bg-surface animate-pulse" />}
              </div>
              <StageProgress stages={stream.stages} />
            </div>

            {stream.error && stream.seed && <ErrorBanner message={stream.error} />}

            {stream.results && <RecommendationList recommendations={stream.results} />}

            {stream.running && !stream.results && (
              <div className="flex flex-col gap-3" aria-hidden>
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-28 rounded-2xl bg-bg-surface animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            )}

            {!stream.running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center py-6"
              >
                <button
                  onClick={handleReset}
                  className="group flex items-center gap-2.5 px-7 py-3 rounded-xl border border-[var(--color-border)] hover:border-accent text-text-secondary hover:text-accent transition-all duration-200 text-sm font-medium"
                >
                  <span className="text-base group-hover:-rotate-180 transition-transform duration-300 inline-block">↺</span>
                  Start over
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </AppShell>
  )
}
