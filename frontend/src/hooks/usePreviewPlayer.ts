import { useSyncExternalStore } from 'react'
import { previewUrl } from '../api/client'
import type { Track } from '../types/music'

// One shared <audio> element for the whole app, so starting a preview stops
// whichever one was playing before. State lives in this module; components
// read it through the hooks below.

const audio = typeof Audio !== 'undefined' ? new Audio() : null

interface PlayerState {
  /** Loaded track (playing or paused); null = player closed. */
  track: Track | null
  playing: boolean
  /** The loaded preview failed to load (no preview, or Deezer refused it). */
  failed: boolean
  /** What next/previous step through: the seed song, then the recommendations. */
  queue: Track[]
  /** 0–1; kept separately from `muted` so unmuting restores the old level. */
  volume: number
  muted: boolean
}

const VOLUME_KEY = 'llmusic-volume'

function savedVolume(): { volume: number; muted: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? '')
    if (typeof v.volume === 'number' && v.volume >= 0 && v.volume <= 1) return { volume: v.volume, muted: !!v.muted }
  } catch { /* nothing saved yet */ }
  return { volume: 0.8, muted: false }
}

let state: PlayerState = { track: null, playing: false, failed: false, queue: [], ...savedVolume() }
const listeners = new Set<() => void>()
const progressListeners = new Set<() => void>()

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch }
  listeners.forEach(l => l())
  syncMediaSession()
}

// progress: a per-frame tick while playing, so the cover trace moves smoothly
// (the audio element's own timeupdate fires only ~4 times a second)
let raf = 0
// cached between ticks: useSyncExternalStore needs a stable snapshot, and a
// live currentTime read would differ on every call
let time = { current: 0, duration: 0 }
function emitProgress() {
  if (audio) {
    time = { current: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 }
  }
  progressListeners.forEach(l => l())
}
function tick() {
  emitProgress()
  if (state.playing) raf = requestAnimationFrame(tick)
}

if (audio) {
  audio.volume = state.volume
  audio.muted = state.muted
  audio.addEventListener('play',  () => { set({ playing: true }); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick) })
  audio.addEventListener('pause', () => { set({ playing: false }); emitProgress() })
  audio.addEventListener('loadedmetadata', emitProgress)
  audio.addEventListener('seeked', emitProgress)
  audio.addEventListener('error', () => { if (state.track) set({ playing: false, failed: true }) })
  // previews are 30s: carry on through the list so it can be listened through
  audio.addEventListener('ended', () => { if (!step(1)) emitProgress() })
}

function load(track: Track) {
  if (!audio || !track.preview) return
  audio.src = previewUrl(track.deezer_id)
  emitProgress()  // new track: reset the trace before it starts playing
  set({ track, playing: true, failed: false })
  audio.play().catch(() => set({ playing: false }))
}

/** Index of the nearest playable track from the current one in `dir`, or -1. */
function neighbour(dir: 1 | -1): number {
  const { queue, track } = state
  const at = queue.findIndex(t => t.deezer_id === track?.deezer_id)
  if (at < 0) return -1
  for (let i = at + dir; i >= 0 && i < queue.length; i += dir) {
    if (queue[i].preview) return i
  }
  return -1
}

/** Play the next/previous playable track in the queue. Returns false at either end. */
export function step(dir: 1 | -1): boolean {
  const i = neighbour(dir)
  if (i < 0) return false
  load(state.queue[i])
  return true
}

/** Click on a cover: play it, or pause/resume if it's the loaded track. */
export function togglePreview(track: Track) {
  if (!audio) return
  if (state.track?.deezer_id === track.deezer_id) {
    if (audio.paused) audio.play().catch(() => set({ playing: false }))
    else audio.pause()
  } else {
    load(track)
  }
}

export function stopPreview() {
  if (!audio) return
  audio.pause()
  cancelAnimationFrame(raf)
  set({ track: null, playing: false, failed: false })
}

export function seek(fraction: number) {
  if (!audio || !Number.isFinite(audio.duration)) return
  audio.currentTime = Math.min(1, Math.max(0, fraction)) * audio.duration
}

/** Set the level (0–1). Moving the slider also unmutes, unless it's moved to 0. */
export function setVolume(volume: number) {
  applyVolume(Math.min(1, Math.max(0, volume)), volume <= 0)
}

/** Mute/unmute; unmuting from a level of 0 restores a sensible one. */
export function toggleMute() {
  if (state.muted || state.volume === 0) applyVolume(state.volume || 0.5, false)
  else applyVolume(state.volume, true)
}

function applyVolume(volume: number, muted: boolean) {
  if (audio) { audio.volume = volume; audio.muted = muted }
  set({ volume, muted })
  try { localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume, muted })) } catch { /* private mode */ }
}

export function setPreviewQueue(queue: Track[]) {
  set({ queue })
}


// ── hooks ──────────────────────────────────────────────────────────────

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
function subscribeProgress(listener: () => void) {
  progressListeners.add(listener)
  return () => { progressListeners.delete(listener) }
}

export function usePlayer() {
  const s = useSyncExternalStore(subscribe, () => state)
  return { ...s, hasPrev: neighbour(-1) >= 0, hasNext: neighbour(1) >= 0 }
}

/** Whether the preview for `id` is the one currently playing. */
export function useIsPlaying(id: number): boolean {
  return useSyncExternalStore(subscribe, () => state.playing && state.track?.deezer_id === id)
}

/** Whether `id` is the loaded track (playing or paused). */
export function useIsCurrent(id: number): boolean {
  return useSyncExternalStore(subscribe, () => state.track?.deezer_id === id)
}

/** Seconds into the loaded preview and its length (0 until metadata loads).
 *  Re-renders every frame while playing. */
export function usePreviewTime(): { current: number; duration: number } {
  return useSyncExternalStore(subscribeProgress, () => time)
}

// ── lock screen / headset controls ─────────────────────────────────────

function syncMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  const t = state.track
  ms.playbackState = t ? (state.playing ? 'playing' : 'paused') : 'none'
  if (!t) { ms.metadata = null; return }
  if (ms.metadata?.title !== t.title || ms.metadata?.artist !== t.artist) {
    ms.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      album: t.album,
      artwork: t.cover ? [{ src: t.cover }] : [],
    })
  }
}

if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && audio) {
  const ms = navigator.mediaSession
  ms.setActionHandler('play', () => { audio.play().catch(() => {}) })
  ms.setActionHandler('pause', () => audio.pause())
  ms.setActionHandler('previoustrack', () => { step(-1) })
  ms.setActionHandler('nexttrack', () => { step(1) })
}
