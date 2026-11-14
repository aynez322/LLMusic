import { useEffect, type RefObject } from 'react'
import { prefersReducedMotion } from '../lib/media'

export interface PlaceholderExample { title: string; artist: string }

interface Options {
  typeSpeed?: number    // ms per typed character
  deleteSpeed?: number  // ms per deleted character
  pauseDelay?: number   // how long a finished example stays up
}

const PREFIX = 'e.g. '
const CURSOR = '|'
const BLINK = 530

/**
 * Typewriter placeholders for the song/artist pair (after Magic UI's
 * TypingAnimation): types a title, then its artist, holds with a blinking
 * cursor, deletes both and moves to the next example.
 *
 * Writes the placeholder attribute directly instead of through state, so the
 * form doesn't re-render on every character. Holds still while either field
 * is focused or filled in, and stays static for reduced motion.
 */
export function useTypingPlaceholders(
  titleRef: RefObject<HTMLInputElement | null>,
  artistRef: RefObject<HTMLInputElement | null>,
  examples: PlaceholderExample[],
  { typeSpeed = 100, deleteSpeed = 50, pauseDelay = 2000 }: Options = {},
) {
  useEffect(() => {
    const t = titleRef.current
    const a = artistRef.current
    if (!t || !a || !examples.length) return

    const show = (el: HTMLInputElement, text: string, cursor = false) => {
      const next = PREFIX + text + (cursor ? CURSOR : '')
      if (el.placeholder !== next) el.placeholder = next
    }
    const showWhole = (ex: PlaceholderExample) => { show(t, ex.title); show(a, ex.artist) }

    if (prefersReducedMotion()) { showWhole(examples[0]); return }

    type Phase = 'title' | 'artist' | 'hold' | 'delArtist' | 'delTitle'
    let i = 0
    let phase: Phase = 'title'
    let n = 0
    let blinkOn = true
    let timer = 0

    const render = () => {
      const ex = examples[i]
      const cursorOn = phase === 'hold' ? blinkOn : true
      switch (phase) {
        case 'title':
        case 'delTitle':
          show(t, ex.title.slice(0, n), cursorOn); show(a, ''); break
        case 'artist':
        case 'delArtist':
          show(t, ex.title); show(a, ex.artist.slice(0, n), cursorOn); break
        case 'hold':
          show(t, ex.title); show(a, ex.artist, cursorOn); break
      }
    }

    // someone is using the form: leave a whole, still example and wait
    const busy = () =>
      document.activeElement === t || document.activeElement === a || !!t.value || !!a.value

    const step = () => {
      if (busy()) {
        showWhole(examples[i])
        phase = 'hold'
        timer = window.setTimeout(step, 400)
        return
      }
      const ex = examples[i]
      let wait = typeSpeed
      switch (phase) {
        case 'title':
          if (++n >= ex.title.length) { phase = 'artist'; n = 0; wait = 350 }
          break
        case 'artist':
          if (++n >= ex.artist.length) { phase = 'hold'; wait = pauseDelay }
          break
        case 'hold':
          phase = 'delArtist'; n = ex.artist.length; wait = deleteSpeed
          break
        case 'delArtist':
          wait = deleteSpeed
          if (--n <= 0) { phase = 'delTitle'; n = ex.title.length }
          break
        case 'delTitle':
          wait = deleteSpeed
          if (--n <= 0) { i = (i + 1) % examples.length; phase = 'title'; n = 0; wait = 400 }
          break
      }
      render()
      timer = window.setTimeout(step, wait)
    }

    // the cursor blinks only while an example is held, as in a real editor
    const blink = window.setInterval(() => {
      blinkOn = !blinkOn
      if (phase === 'hold' && !busy()) render()
    }, BLINK)

    show(t, '', true); show(a, '')
    timer = window.setTimeout(step, 600)
    return () => { window.clearTimeout(timer); window.clearInterval(blink) }
  }, [titleRef, artistRef, examples, typeSpeed, deleteSpeed, pauseDelay])
}
