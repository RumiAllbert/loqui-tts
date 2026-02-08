import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  flat?: boolean
}

export function GlassCard({ children, className = '', flat }: Props) {
  return (
    <div className={`${flat ? 'card-flat' : 'card'} p-5 ${className}`}>
      {children}
    </div>
  )
}
