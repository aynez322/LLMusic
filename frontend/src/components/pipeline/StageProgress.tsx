import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { StageState, StageStatus } from '../../types/music'
import { Spinner } from '../ui/Spinner'

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === 'running') return <Spinner size={16} />
  if (status === 'done') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="var(--color-success)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </svg>
    )
  }
  if (status === 'error') return <span className="text-red-400 text-xs font-bold leading-none">✕</span>
  return <span className="w-3.5 h-3.5 rounded-full border border-text-muted/50 block" />
}

function StageList({ stages }: { stages: StageState[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {stages.map(stage => (
        <div key={stage.id} className="flex items-start gap-3">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage.status}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <StatusIcon status={stage.status} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="min-w-0">
            <p className={`text-sm ${stage.status === 'idle' ? 'text-text-muted' : 'text-text-secondary'}`}>
              {stage.label}
            </p>
            {stage.detail && <p className="text-text-muted text-xs mt-0.5">{stage.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Full step-by-step panel, shown while the search runs (or when a step failed). */
export function StageProgress({ stages }: { stages: StageState[] }) {
  return (
    <motion.div
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-5 card-glow h-full"
      aria-live="polite"
      aria-label="Progress"
    >
      <StageList stages={stages} />
    </motion.div>
  )
}

/** Once every step is done: one line inside the seed card, steps one click away. */
export function StageSummary({ stages }: { stages: StageState[] }) {
  const [open, setOpen] = useState(false)
  const details = stages.map(s => s.detail).filter(Boolean)
  return (
    <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
      {/* icon stays with its text; the toggle wraps under it on narrow screens */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex-shrink-0"><StatusIcon status="done" /></span>
        <div className="flex-1 min-w-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-text-secondary text-sm">
            Done{details.length > 0 && <span className="text-text-muted">: {details.join(', ')}</span>}
          </p>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            className="text-sm text-text-muted hover:text-accent transition-colors"
          >
            {open ? 'Hide steps' : 'Show steps'}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <StageList stages={stages} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
