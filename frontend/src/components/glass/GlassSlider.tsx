import { InfoTip } from '../ui/InfoTip'

interface Props {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

export function GlassSlider({ label, hint, value, onChange, min = 0, max = 1, step = 0.05 }: Props) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <label className="text-sm text-stone-600">{label}</label>
          {hint && <InfoTip text={hint} />}
        </div>
        <span className="text-xs text-stone-400 font-mono tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full slider-track"
        style={{
          background: `linear-gradient(to right, #78716c ${percent}%, #e7e5e4 ${percent}%)`,
        }}
      />
    </div>
  )
}
