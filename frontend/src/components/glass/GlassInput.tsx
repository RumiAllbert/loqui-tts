import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  charCount?: number
  maxChars?: number
}

export function GlassInput({ label, charCount, maxChars, className = '', ...props }: Props) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm text-stone-600">{label}</label>
          {maxChars !== undefined && charCount !== undefined && (
            <span className="text-xs text-stone-400 font-mono tabular-nums">
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      )}
      <textarea
        className={`input-field w-full px-4 py-3 text-sm min-h-[140px] resize-y leading-relaxed ${className}`}
        {...props}
      />
    </div>
  )
}
