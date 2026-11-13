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

export function StageProgress({ stages }: { stages: StageState[] }) {
  return (
    <motion.div
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-5 card-glow"
      aria-live="polite"
      aria-label="Progress"
    >
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
              {stage.detail && <p className="text-text-muted text-[11px] mt-0.5">{stage.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
