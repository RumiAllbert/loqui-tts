import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  label?: string
  labelExtra?: ReactNode
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function GlassSelect({ label, labelExtra, value, onChange, options, className = '' }: Props) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center gap-1">
          <label className="text-sm text-stone-600">{label}</label>
          {labelExtra}
        </div>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field w-full px-3 py-2 text-sm appearance-none cursor-pointer pr-8"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  )
}
