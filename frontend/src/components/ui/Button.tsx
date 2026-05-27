import { motion } from 'framer-motion'
import { Spinner } from './Spinner'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
  shake?: boolean
}

export function Button({
  children,
  onClick,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  shake = false,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      animate={shake ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={`
        inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
        font-semibold text-sm text-white
        bg-accent hover:bg-accent-light
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading && <Spinner size={15} color="white" />}
      {children}
    </motion.button>
  )
}
