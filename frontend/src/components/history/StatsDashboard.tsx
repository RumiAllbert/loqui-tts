import { useMemo } from 'react'
import { AudioLines, Clock, Type, Zap, BarChart3 } from 'lucide-react'
import type { HistoryEntry } from '../../types'
import { MODEL_INFO } from '../../utils/constants'
import type { ModelVariant } from '../../types'

interface Props {
  history: HistoryEntry[]
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof AudioLines
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/80">
      <div className="w-8 h-8 rounded-lg bg-stone-200/60 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-stone-500" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-stone-800 leading-tight">{value}</div>
        <div className="text-[11px] text-stone-400 leading-tight mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-stone-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-stone-500 w-16 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
        />
      </div>
      <span className="text-[10px] text-stone-400 font-mono w-6 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

export function StatsDashboard({ history }: Props) {
  const stats = useMemo(() => {
    const totalAudio = history.reduce((s, e) => s + e.duration_seconds, 0)
    const totalGenTime = history.reduce((s, e) => s + e.generation_time_seconds, 0)
    const totalWords = history.reduce((s, e) => s + e.text.trim().split(/\s+/).filter(Boolean).length, 0)
    const totalChars = history.reduce((s, e) => s + e.text.length, 0)
    const count = history.length

    // Model usage
    const modelCounts: Record<string, number> = {}
    for (const e of history) {
      modelCounts[e.model_variant] = (modelCounts[e.model_variant] || 0) + 1
    }
    const modelEntries = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
    const modelMax = modelEntries.length > 0 ? modelEntries[0][1] : 0

    // Language usage (only non-null)
    const langCounts: Record<string, number> = {}
    for (const e of history) {
      if (e.language) {
        langCounts[e.language] = (langCounts[e.language] || 0) + 1
      }
    }
    const langEntries = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    const langMax = langEntries.length > 0 ? langEntries[0][1] : 0

    return {
      count,
      totalAudio,
      totalGenTime,
      totalWords,
      totalChars,
      avgWords: count > 0 ? Math.round(totalWords / count) : 0,
      avgDuration: count > 0 ? totalAudio / count : 0,
      avgGenTime: count > 0 ? totalGenTime / count : 0,
      modelEntries,
      modelMax,
      langEntries,
      langMax,
    }
  }, [history])

  const fmtTime = (s: number) => {
    if (s < 60) return `${s.toFixed(1)}s`
    const m = Math.floor(s / 60)
    const sec = Math.round(s % 60)
    return `${m}m ${sec}s`
  }

  const LANG_NAMES: Record<string, string> = {
    en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
    fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
    ru: 'Russian', pt: 'Portuguese',
  }

  const BAR_COLORS = [
    'bg-stone-700', 'bg-stone-500', 'bg-stone-400', 'bg-stone-300', 'bg-stone-200',
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={AudioLines}
          label="Generations"
          value={String(stats.count)}
          sub={`${fmtTime(stats.totalAudio)} total audio`}
        />
        <StatCard
          icon={Clock}
          label="Avg generation time"
          value={`${stats.avgGenTime.toFixed(1)}s`}
          sub={`${fmtTime(stats.totalGenTime)} total`}
        />
        <StatCard
          icon={Type}
          label="Avg words"
          value={String(stats.avgWords)}
          sub={`${stats.totalWords.toLocaleString()} total`}
        />
        <StatCard
          icon={Zap}
          label="Avg duration"
          value={`${stats.avgDuration.toFixed(1)}s`}
          sub={`${stats.totalChars.toLocaleString()} total chars`}
        />
      </div>

      {/* Breakdown bars */}
      {(stats.modelEntries.length > 0 || stats.langEntries.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.modelEntries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-stone-400" />
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Models used</span>
              </div>
              <div className="space-y-1.5">
                {stats.modelEntries.map(([variant, count], i) => (
                  <MiniBar
                    key={variant}
                    label={MODEL_INFO[variant as ModelVariant]?.label || variant}
                    value={count}
                    max={stats.modelMax}
                    color={BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]}
                  />
                ))}
              </div>
            </div>
          )}
          {stats.langEntries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-stone-400" />
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Languages</span>
              </div>
              <div className="space-y-1.5">
                {stats.langEntries.map(([lang, count], i) => (
                  <MiniBar
                    key={lang}
                    label={LANG_NAMES[lang] || lang}
                    value={count}
                    max={stats.langMax}
                    color={BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
