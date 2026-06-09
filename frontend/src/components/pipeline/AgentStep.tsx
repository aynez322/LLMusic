import { motion, AnimatePresence } from 'framer-motion'
import type { AgentState } from '../../types/music'
import { Spinner } from '../ui/Spinner'

interface AgentStepProps {
  agent: AgentState
}

function StatusIcon({ status }: { status: AgentState['status'] }) {
  if (status === 'running') return <Spinner size={16} />
  if (status === 'done') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  if (status === 'error') {
    return <span className="text-red-400 text-xs font-bold leading-none">✕</span>
  }
  return (
    <span className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)] block" />
  )
}

const STATUS_TEXT: Record<AgentState['status'], string> = {
  idle:    'Waiting',
  running: 'Running…',
  done:    'Done',
  error:   'Error',
}

const STATUS_COLOR: Record<AgentState['status'], string> = {
  idle:    'text-text-muted',
  running: 'text-cyan',
  done:    'text-success',
  error:   'text-red-400',
}

export function AgentStep({ agent }: AgentStepProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 flex items-center justify-center flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={agent.status}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <StatusIcon status={agent.status} />
          </motion.div>
        </AnimatePresence>
      </div>

      <span className="flex-1 text-text-secondary text-sm">{agent.label}</span>

      <span className={`text-[10px] font-medium tabular-nums ${STATUS_COLOR[agent.status]}`}>
        {STATUS_TEXT[agent.status]}
      </span>
    </div>
  )
}
