import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Search a Song',
    desc: 'Type any track name and artist. Our system looks it up in a dataset of 114 000+ songs.',
  },
  {
    num: '02',
    title: 'AI Extracts Features',
    desc: 'Nine audio features — energy, danceability, tempo, valence and more — are pulled and scored.',
  },
  {
    num: '03',
    title: 'Get Recommendations',
    desc: 'A multi-agent CrewAI pipeline finds the closest matches and explains why they fit your taste.',
  },
]

export function HowItWorks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18, ease: 'easeOut' }}
      className="mt-10"
    >
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="font-display text-text-secondary text-sm tracking-[0.12em] uppercase">
          How It Works
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 + i * 0.07, ease: 'easeOut' }}
            className="relative rounded-2xl border border-[var(--color-border)] bg-bg-surface p-5 overflow-hidden"
          >
            {/* subtle number watermark */}
            <span
              className="pointer-events-none absolute -top-2 -right-1 font-display font-bold text-7xl leading-none select-none"
              style={{ color: 'var(--color-border)', opacity: 0.6 }}
            >
              {step.num}
            </span>

            <p className="gradient-text text-xl font-bold leading-none mb-3 select-none">
              {step.num}
            </p>
            <h3 className="text-text-primary text-sm font-semibold mb-1">
              {step.title}
            </h3>
            <p className="text-text-muted text-xs leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
