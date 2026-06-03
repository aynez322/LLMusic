import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface AnalysisReportProps {
  markdown: string
}

const WRAP: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' }

const mdComponents: Components = {
  h2: ({ children }) => (
    <h2 className="gradient-text text-base font-bold mt-0 mb-3 leading-snug" style={WRAP}>
      {children}
    </h2>
  ),

  /* song entry title — no heading visual, no ### marker, just a named row */
  h3: ({ children }) => (
    <div className="flex items-start gap-2 mt-5 mb-1">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      <span className="text-text-primary font-semibold text-sm leading-snug" style={WRAP}>
        {children}
      </span>
    </div>
  ),

  p: ({ children }) => (
    <p className="text-text-secondary text-sm leading-relaxed mb-3" style={WRAP}>
      {children}
    </p>
  ),

  strong: ({ children }) => (
    <strong className="text-text-primary font-semibold">{children}</strong>
  ),

  em: ({ children }) => <em className="text-text-secondary italic">{children}</em>,

  li: ({ children }) => (
    <li className="text-text-secondary text-sm leading-relaxed mb-1" style={WRAP}>
      {children}
    </li>
  ),

  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-3 pl-1">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 pl-1">{children}</ol>
  ),

  /* inline code — wraps, no scroll */
  code: ({ children }) => (
    <code
      className="text-xs font-mono text-accent bg-bg-raised rounded px-1.5 py-0.5"
      style={{ wordBreak: 'break-all' }}
    >
      {children}
    </code>
  ),

  /* fenced code block — wraps via pre-wrap, no horizontal scroll */
  pre: ({ children }) => (
    <pre
      className="bg-bg-raised rounded-lg my-3 px-4 py-3 text-xs text-text-secondary font-mono"
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      {children}
    </pre>
  ),
}

export function AnalysisReport({ markdown }: AnalysisReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-6 card-glow overflow-hidden min-w-0"
    >
      <p className="text-text-muted text-[10px] uppercase tracking-widest mb-4 font-medium">
        Full AI Analysis
      </p>
      <div className="min-w-0" style={WRAP}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {markdown}
        </ReactMarkdown>
      </div>
    </motion.div>
  )
}
