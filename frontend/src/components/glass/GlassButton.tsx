import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function GlassButton({ children, variant = 'secondary', size = 'md', className = '', ...props }: Props) {
  const base = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all duration-150',
  }[variant]

  const sizeClass = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
  }[size]

  return (
    <button className={`${base} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
