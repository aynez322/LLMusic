import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppShell } from './components/layout/AppShell'
import { StickySeedBar } from './components/layout/StickySeedBar'
import { Footer } from './components/layout/Footer'
import { SearchBar } from './components/search/SearchBar'
import { SongNotFound } from './components/search/SongNotFound'
import { SeedCard } from './components/song/SeedCard'
import { RecommendationList } from './components/recommendations/RecommendationList'
import { StageProgress, StageSummary } from './components/pipeline/StageProgress'
import { useRecommendStream } from './hooks/useRecommendStream'
import { setPreviewQueue, stopPreview } from './hooks/usePreviewPlayer'
import { MiniPlayer } from './components/player/MiniPlayer'
import { LoaderVinyl } from './components/aceternity/loader'
import { useTheme } from './hooks/useTheme'
import { TopTracksCarousel } from './components/home/TopTracksCarousel'
import { HowItWorks } from './components/home/HowItWorks'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { ErrorBanner } from './components/ui/ErrorBanner'
import { scrollBehavior } from './lib/media'
import {
  DEFAULT_DISCOVERY, pushHome, pushQuery, readQuery, replaceHome, replaceQuery, type SearchQuery,
} from './lib/urlState'
import type { Track } from './types/music'

const APP_TITLE = 'Listeners Like Me'

/** The search the results on screen came from. */
interface ActiveQuery { title: string; artist: string; discovery: number }

function toActive(q: SearchQuery): ActiveQuery {
  return { title: q.title ?? '', artist: q.artist ?? '', discovery: q.discovery }
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const stream = useRecommendStream()

  // a shared link or reload opens straight on its results, not on the home page
  const [lastQuery, setLastQuery] = useState<ActiveQuery | null>(() => {
    const q = readQuery()
    return q ? toActive(q) : null
  })
  const [discovery, setDiscovery] = useState(() => readQuery()?.discovery ?? DEFAULT_DISCOVERY)
  const [searchKey, setSearchKey] = useState(0)
  const [formDefaults, setFormDefaults] = useState({ title: '', artist: '' })
  const [searchOutOfView, setSearchOutOfView] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)


  // next/previous in the player walk the seed song, then the recommendations
  useEffect(() => {
    setPreviewQueue(stream.seed ? [stream.seed, ...(stream.results ?? []).map(r => r.track)] : [])
  }, [stream.seed, stream.results])

  const started  = lastQuery !== null
  const notFound = started && !stream.seed && !!stream.error
  const showHome = !started
  const finished = !stream.running && stream.stages.every(s => s.status === 'done')
  // Discovery moved since these results were made: offer to redo them
  const canRerun = started && !stream.running && !!stream.seed
    && Math.abs(discovery - (lastQuery?.discovery ?? discovery)) > 0.001

  /**
   * Start a search. `history`: push a new entry (a user action), or leave the
   * URL alone because it already says this (back button, opened link).
   * `fromUrl`: the form is empty then, so fill it in once the song is known.
   */
  function run(q: SearchQuery, history: 'push' | 'none', fromUrl = false) {
    stopPreview()
    setLastQuery(toActive(q))
    setDiscovery(q.discovery)
    if (history === 'push') pushQuery(q)
    stream.start(
      q.deezerId
        ? { deezerId: q.deezerId, discovery: q.discovery }
        : { title: q.title, artist: q.artist, discovery: q.discovery },
      {
        onSeed: (seed) => {
          // typed text resolved to an exact track: link to that from now on
          replaceQuery({ deezerId: seed.deezer_id, discovery: q.discovery })
          document.title = `Similar to ${seed.title} | ${APP_TITLE}`
          setLastQuery({ title: seed.title, artist: seed.artist, discovery: q.discovery })
          if (fromUrl) {
            setFormDefaults({ title: seed.title, artist: seed.artist })
            setSearchKey(k => k + 1)
          }
        },
      },
    )
  }

  function recommendFromTrack(track: Track) {
    run({ deezerId: track.deezer_id, title: track.title, artist: track.artist, discovery }, 'push')
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  }

  function recommendFromText(title: string, artist: string) {
    run({ title, artist, discovery }, 'push')
  }

  function rerun() {
    if (stream.seed) recommendFromTrack(stream.seed)
  }

  function goHome(history: 'push' | 'replace' | 'none') {
    stopPreview()
    stream.reset()
    setLastQuery(null)
    setFormDefaults({ title: '', artist: '' })
    setSearchKey(k => k + 1)
    document.title = APP_TITLE
    if (history === 'push') pushHome()
    if (history === 'replace') replaceHome()
    // "Start over" sits at the bottom of a long list; home starts at the top
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  }

  function handleReset() {
    goHome('push')
  }

  // misclicked a song: stop the search and drop it from history, so Back
  // doesn't lead straight into it again
  function handleCancel() {
    goHome('replace')
  }

  function focusSearch() {
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
    const input = document.getElementById('song-title') as HTMLInputElement | null
    input?.focus({ preventScroll: true })
    input?.select()
  }

  // follow the URL: on first load (shared link / reload) and on back/forward.
  // Read through a ref so the listener always sees the latest state.
  const followUrl = useRef(() => {})
  useEffect(() => {
    followUrl.current = () => {
      const q = readQuery()
      if (q) run(q, 'none', true)
      else goHome('none')
    }
  })
  useEffect(() => {
    if (readQuery()) followUrl.current()
    const onPop = () => followUrl.current()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // the sticky bar takes over once the full search form scrolls away
  useEffect(() => {
    const el = searchRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setSearchOutOfView(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <AppShell
      themeToggle={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
      // the player is sticky, not fixed: it rides along at the bottom of the
      // screen, then parks above the footer at the end of the page
      footer={<>
        <MiniPlayer />
        <Footer />
      </>}
    >

      <StickySeedBar seed={stream.seed} visible={started && searchOutOfView} onNewSearch={focusSearch} onHome={handleReset} />

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
        ref={searchRef}
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
          defaultTitle={formDefaults.title}
          defaultArtist={formDefaults.artist}
          onRerun={canRerun ? rerun : undefined}
          onCancel={stream.running ? handleCancel : undefined}
          onHome={started && !stream.running ? handleReset : undefined}
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
            {finished && stream.seed ? (
              // done: the steps fold into one line and the song gets the full width
              <SeedCard track={stream.seed}>
                <StageSummary stages={stream.stages} />
              </SeedCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {stream.seed
                    ? <SeedCard track={stream.seed} />
                    : <div className="h-full min-h-40 rounded-2xl bg-bg-surface animate-pulse" />}
                </div>
                <StageProgress stages={stream.stages} />
              </div>
            )}

            {stream.error && stream.seed && <ErrorBanner message={stream.error} />}

            {stream.results && <RecommendationList recommendations={stream.results} />}

            {/* where the results will land: a record spinning while the search runs */}
            {stream.running && !stream.results && (
              <div role="status" className="flex flex-col items-center gap-4 py-12">
                <LoaderVinyl size={88} />
                <p className="text-text-secondary text-sm">Finding songs that sound alike…</p>
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
