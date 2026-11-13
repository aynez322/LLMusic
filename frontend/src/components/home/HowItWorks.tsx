import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Pick a Song',
    desc: 'Type a song and artist and choose the exact track — anything on Deezer works, including new releases.',
  },
  {
    num: '02',
    title: 'Follow the Listeners',
    desc: 'Last.fm and ListenBrainz show what people who love that song also play, and which artists go together.',
  },
  {
    num: '03',
    title: 'Listen & Rank',
    desc: 'An audio AI listens to every candidate’s preview, keeps the ones that really sound alike, and tells you why.',
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
