import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppShell } from './components/layout/AppShell'
import { SearchBar } from './components/search/SearchBar'
import { SongNotFound } from './components/search/SongNotFound'
import { SongCard } from './components/song/SongCard'
import { RecommendationList } from './components/recommendations/RecommendationList'
import { AgentStatusPanel } from './components/pipeline/AgentStatusPanel'
import { AnalysisReport } from './components/pipeline/AnalysisReport'
import { ErrorBanner } from './components/ui/ErrorBanner'
import { useSongLookup } from './hooks/useSongLookup'
import { useSimilarSongs } from './hooks/useSimilarSongs'
import { useRecommendStream } from './hooks/useRecommendStream'
import { extractExplanations } from './utils/featureLabels'
import { TopTracksCarousel } from './components/home/TopTracksCarousel'
import { StreamingLinksPanel } from './components/pipeline/StreamingLinksPanel'

export default function App() {
  const lookupHook = useSongLookup()
  const similarHook = useSimilarSongs()
  const streamHook = useRecommendStream()

  const [searchKey, setSearchKey] = useState(0)
  const [lastSearched, setLastSearched] = useState<{ title: string; artist: string } | null>(null)

  const hasResults   = !!lookupHook.song
  const isLoading    = lookupHook.loading
  const hasError     = !hasResults && !!lookupHook.error
  const explanations = streamHook.markdown ? extractExplanations(streamHook.markdown) : {}

  function handleReset() {
    lookupHook.reset()
    similarHook.reset()
    streamHook.reset()
    setLastSearched(null)
    setSearchKey(k => k + 1)
  }

  async function handleSubmit(title: string, artist: string) {
    setLastSearched({ title, artist })
    streamHook.reset()

    const [songResult] = await Promise.all([
      lookupHook.lookup(title, artist),
      similarHook.search(title, artist),
    ])

    if (songResult) {
      streamHook.start(title, artist)
    }
  }

  return (
    <AppShell>

      {/* ── Hero (idle, no error) ────────────────────────── */}
      <AnimatePresence>
        {!hasResults && !isLoading && !hasError && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, transition: { duration: 0.18 } }}
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
              <span className="font-display text-text-secondary text-xl tracking-wide">LLMusic</span>
            </div>

            <h1 className="gradient-text text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Discover Your Sound
            </h1>
            <p className="text-text-secondary text-base mt-3 max-w-sm mx-auto leading-relaxed">
              Enter any song and our AI will find the most musically similar tracks using 9 audio features.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search bar (always visible) ──────────────────── */}
      <div className={!hasResults ? 'max-w-2xl mx-auto' : 'mb-6'}>
        <SearchBar
          key={searchKey}
          onSubmit={handleSubmit}
          loading={isLoading}
        />
      </div>

      {/* ── Song not found ───────────────────────────────── */}
      <AnimatePresence>
        {hasError && lastSearched && (
          <SongNotFound
            key="not-found"
            title={lastSearched.title}
            artist={lastSearched.artist}
            suggestions={lookupHook.error?.suggestions ?? []}
            onDismiss={handleReset}
            onSuggestionSelect={(t) => handleSubmit(t, lastSearched.artist)}
          />
        )}
      </AnimatePresence>

      {/* ── Top Tracks Carousel (idle, no error) ─────────── */}
      <AnimatePresence>
        {!hasResults && !isLoading && !hasError && (
          <motion.div
            key="carousel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TopTracksCarousel onSelect={handleSubmit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────── */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {streamHook.error && (
              <ErrorBanner message={streamHook.error} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SongCard song={lookupHook.song!} />
              </div>
              <div className="flex flex-col gap-4">
                <AgentStatusPanel agents={streamHook.agents} />
                <StreamingLinksPanel
                  title={lookupHook.song!.track_name}
                  artist={lookupHook.song!.artists}
                />
              </div>
            </div>

            {similarHook.recommendations && (
              <RecommendationList
                recommendations={similarHook.recommendations}
                explanations={explanations}
              />
            )}

            {streamHook.markdown && (
              <AnalysisReport markdown={streamHook.markdown} />
            )}

            {/* Make another search */}
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
                Make another search
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AppShell>
  )
}
