import { useMemo, useState, useEffect } from 'react'
import { AudioLines, Clock, Type, Zap, Cpu, MemoryStick, HardDrive, Monitor } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { ModelVariant } from '../../types'
import { MODEL_INFO } from '../../utils/constants'
import { useAppStore } from '../../stores/appStore'
import { fetchSystemInfo, type SystemInfo } from '../../api/models'

const COLORS = ['#44403c', '#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4']

const LANG_NAMES: Record<string, string> = {
  en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
  ru: 'Russian', pt: 'Portuguese',
}

function fmtTime(s: number) {
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  if (m < 60) return `${m}m ${sec}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof AudioLines; label: string; value: string; sub?: string
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-stone-200/80 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-stone-500" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold text-stone-800 leading-tight tabular-nums">{value}</div>
        <div className="text-xs text-stone-500 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-stone-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-stone-200/80 shadow-sm p-4">
      <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  )
}

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <div className="text-stone-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

/* ── Ring gauge ──────────────────────────────────────── */
function RingGauge({ percent, size = 56, strokeWidth = 5, color = '#44403c' }: {
  percent: number; size?: number; strokeWidth?: number; color?: string
}) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(percent, 100) / 100) * circ

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        className="text-[10px] font-semibold fill-stone-700">
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

/* ── System info section ─────────────────────────────── */
function SystemSection({ sys }: { sys: SystemInfo }) {
  const memColor = sys.memory.percent > 85 ? '#dc2626' : sys.memory.percent > 70 ? '#d97706' : '#44403c'
  const diskColor = sys.disk.percent > 90 ? '#dc2626' : sys.disk.percent > 75 ? '#d97706' : '#44403c'

  return (
    <div className="rounded-xl bg-white border border-stone-200/80 shadow-sm p-4 space-y-4">
      <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">System</h3>

      {/* Chip + OS header */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-stone-50">
        <Monitor className="w-5 h-5 text-stone-400 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-stone-800">{sys.chip}</div>
          <div className="text-[11px] text-stone-400">{sys.os}</div>
        </div>
      </div>

      {/* Gauges row */}
      <div className="grid grid-cols-3 gap-3">
        {/* CPU */}
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-stone-50">
          <RingGauge percent={sys.cpu.usage_percent} color="#44403c" />
          <div className="text-center">
            <div className="text-[11px] font-medium text-stone-600">CPU</div>
            <div className="text-[10px] text-stone-400">{sys.cpu.cores_physical} cores</div>
          </div>
        </div>

        {/* Memory */}
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-stone-50">
          <RingGauge percent={sys.memory.percent} color={memColor} />
          <div className="text-center">
            <div className="text-[11px] font-medium text-stone-600">Memory</div>
            <div className="text-[10px] text-stone-400">{sys.memory.used_gb}/{sys.memory.total_gb} GB</div>
          </div>
        </div>

        {/* Disk */}
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-stone-50">
          <RingGauge percent={sys.disk.percent} color={diskColor} />
          <div className="text-center">
            <div className="text-[11px] font-medium text-stone-600">Disk</div>
            <div className="text-[10px] text-stone-400">{sys.disk.free_gb} GB free</div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-stone-400">CPU cores</span>
          <span className="text-stone-600 font-medium">{sys.cpu.cores_physical}P / {sys.cpu.cores_logical}L</span>
        </div>
        {sys.gpu.cores && (
          <div className="flex justify-between">
            <span className="text-stone-400">GPU cores</span>
            <span className="text-stone-600 font-medium">{sys.gpu.cores}-core</span>
          </div>
        )}
        {sys.gpu.neural_engine_cores && (
          <div className="flex justify-between">
            <span className="text-stone-400">Neural Engine</span>
            <span className="text-stone-600 font-medium">{sys.gpu.neural_engine_cores}-core</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-stone-400">Unified Memory</span>
          <span className="text-stone-600 font-medium">{sys.memory.total_gb} GB</span>
        </div>
        {sys.gpu.metal_active_gb > 0 && (
          <div className="flex justify-between">
            <span className="text-stone-400">Metal active</span>
            <span className="text-stone-600 font-medium">{sys.gpu.metal_active_gb} GB</span>
          </div>
        )}
        {sys.gpu.metal_peak_gb > 0 && (
          <div className="flex justify-between">
            <span className="text-stone-400">Metal peak</span>
            <span className="text-stone-600 font-medium">{sys.gpu.metal_peak_gb} GB</span>
          </div>
        )}
        {sys.model.loaded_variant && (
          <div className="flex justify-between">
            <span className="text-stone-400">Loaded model</span>
            <span className="text-stone-600 font-medium">{MODEL_INFO[sys.model.loaded_variant as ModelVariant]?.label || sys.model.loaded_variant}</span>
          </div>
        )}
      </div>

      {/* Software versions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { label: 'Python', value: sys.software.python },
          { label: 'MLX', value: sys.software.mlx },
          { label: 'mlx-audio', value: sys.software.mlx_audio },
        ].map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-[10px]">
            <span className="text-stone-400">{s.label}</span>
            <span className="text-stone-600 font-mono font-medium">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Main stats panel ────────────────────────────────── */
export function StatsPanel() {
  const history = useAppStore((s) => s.history)
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)

  useEffect(() => {
    fetchSystemInfo().then(setSysInfo).catch(() => {})
    const interval = setInterval(() => {
      fetchSystemInfo().then(setSysInfo).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const data = useMemo(() => {
    const count = history.length
    if (count === 0) return null

    const totalAudio = history.reduce((s, e) => s + e.duration_seconds, 0)
    const totalGenTime = history.reduce((s, e) => s + e.generation_time_seconds, 0)
    const totalWords = history.reduce((s, e) => s + e.text.trim().split(/\s+/).filter(Boolean).length, 0)
    const totalChars = history.reduce((s, e) => s + e.text.length, 0)

    // Activity by day
    const dayMap: Record<string, { count: number; audio: number; genTime: number }> = {}
    for (const e of history) {
      const day = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!dayMap[day]) dayMap[day] = { count: 0, audio: 0, genTime: 0 }
      dayMap[day].count++
      dayMap[day].audio += e.duration_seconds
      dayMap[day].genTime += e.generation_time_seconds
    }
    const activityData = Object.entries(dayMap)
      .map(([day, v]) => ({ day, ...v, audio: Math.round(v.audio * 10) / 10 }))
      .reverse()

    // Model usage
    const modelMap: Record<string, number> = {}
    for (const e of history) {
      modelMap[e.model_variant] = (modelMap[e.model_variant] || 0) + 1
    }
    const modelData = Object.entries(modelMap)
      .sort((a, b) => b[1] - a[1])
      .map(([variant, count]) => ({
        name: MODEL_INFO[variant as ModelVariant]?.label || variant,
        variant,
        count,
      }))

    // Language usage
    const langMap: Record<string, number> = {}
    for (const e of history) {
      const lang = e.language || 'en'
      langMap[lang] = (langMap[lang] || 0) + 1
    }
    const langData = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({
        name: LANG_NAMES[code] || code,
        count,
      }))

    // Duration distribution
    const buckets = [
      { label: '0-5s', min: 0, max: 5, count: 0 },
      { label: '5-10s', min: 5, max: 10, count: 0 },
      { label: '10-20s', min: 10, max: 20, count: 0 },
      { label: '20-30s', min: 20, max: 30, count: 0 },
      { label: '30s+', min: 30, max: Infinity, count: 0 },
    ]
    for (const e of history) {
      const b = buckets.find((b) => e.duration_seconds >= b.min && e.duration_seconds < b.max)
      if (b) b.count++
    }
    const durationData = buckets.map(({ label, count }) => ({ label, count }))

    // Generation speed over time (last 20, chronological)
    const speedData = [...history]
      .reverse()
      .slice(-20)
      .map((e, i) => ({
        index: i + 1,
        genTime: Math.round(e.generation_time_seconds * 10) / 10,
        duration: Math.round(e.duration_seconds * 10) / 10,
        words: e.text.trim().split(/\s+/).filter(Boolean).length,
      }))

    return {
      count, totalAudio, totalGenTime, totalWords, totalChars,
      avgWords: Math.round(totalWords / count),
      avgDuration: totalAudio / count,
      avgGenTime: totalGenTime / count,
      activityData, modelData, langData, durationData, speedData,
    }
  }, [history])

  return (
    <div className="space-y-5">
      {/* System info — always visible */}
      {sysInfo && <SystemSection sys={sysInfo} />}

      {!data ? (
        <div className="py-12 text-center text-sm text-stone-400">
          Generate some audio to see usage stats
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={AudioLines} label="Generations" value={String(data.count)}
              sub={`${fmtTime(data.totalAudio)} total audio`} />
            <StatCard icon={Clock} label="Avg gen time" value={`${data.avgGenTime.toFixed(1)}s`}
              sub={`${fmtTime(data.totalGenTime)} total compute`} />
            <StatCard icon={Type} label="Avg words" value={String(data.avgWords)}
              sub={`${data.totalWords.toLocaleString()} total words`} />
            <StatCard icon={Zap} label="Avg duration" value={`${data.avgDuration.toFixed(1)}s`}
              sub={`${data.totalChars.toLocaleString()} total chars`} />
          </div>

          {/* Activity chart */}
          {data.activityData.length > 1 && (
            <ChartCard title="Activity">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.activityData}>
                  <defs>
                    <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#78716c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#78716c" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Generations"
                    stroke="#78716c" strokeWidth={2} fill="url(#activityGrad)"
                    dot={{ r: 3, fill: '#44403c', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#1c1917', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Model + Language charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ChartCard title="Models used">
              <ResponsiveContainer width="100%" height={Math.max(120, data.modelData.length * 36)}>
                <BarChart data={data.modelData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Generations" radius={[0, 4, 4, 0]}>
                    {data.modelData.map((_, i) => (
                      <Cell key={i} fill={COLORS[Math.min(i, COLORS.length - 1)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Languages">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={Math.max(120, data.modelData.length * 36)}>
                  <PieChart>
                    <Pie data={data.langData} dataKey="count" nameKey="name"
                      cx="50%" cy="50%" innerRadius="45%" outerRadius="75%" paddingAngle={2} strokeWidth={0}>
                      {data.langData.map((_, i) => (
                        <Cell key={i} fill={COLORS[Math.min(i, COLORS.length - 1)]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {data.langData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[Math.min(i, COLORS.length - 1)] }} />
                    <span className="text-[10px] text-stone-500">{d.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Duration distribution */}
          <ChartCard title="Audio duration distribution">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.durationData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Generations" fill="#78716c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Generation speed trend */}
          {data.speedData.length > 2 && (
            <ChartCard title="Generation speed (last 20)">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.speedData}>
                  <defs>
                    <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#44403c" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#44403c" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="index" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={30} unit="s" />
                  <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}s`} />} />
                  <Area type="monotone" dataKey="genTime" name="Gen time"
                    stroke="#44403c" strokeWidth={2} fill="url(#speedGrad)"
                    dot={{ r: 2.5, fill: '#44403c', strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#1c1917', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="duration" name="Audio duration"
                    stroke="#a8a29e" strokeWidth={1.5} fill="none"
                    dot={{ r: 2, fill: '#a8a29e', strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#78716c', strokeWidth: 0 }}
                    strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-stone-700" />
                  <span className="text-[10px] text-stone-500">Gen time</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-stone-400 border-dashed" style={{ borderTop: '1.5px dashed #a8a29e', height: 0 }} />
                  <span className="text-[10px] text-stone-500">Audio duration</span>
                </div>
              </div>
            </ChartCard>
          )}
        </>
      )}
    </div>
  )
}
