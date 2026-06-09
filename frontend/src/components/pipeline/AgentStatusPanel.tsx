import { motion } from 'framer-motion'
import type { AgentState } from '../../types/music'
import { AgentStep } from './AgentStep'

interface AgentStatusPanelProps {
  agents: AgentState[]
}

export function AgentStatusPanel({ agents }: AgentStatusPanelProps) {
  return (
    <motion.div
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-5 card-glow"
    >
      <p className="text-text-muted text-[10px] uppercase tracking-widest mb-4 font-medium">
        AI Pipeline
      </p>
      <div className="flex flex-col gap-4">
        {agents.map((agent) => (
          <AgentStep key={agent.id} agent={agent} />
        ))}
      </div>
    </motion.div>
  )
}
