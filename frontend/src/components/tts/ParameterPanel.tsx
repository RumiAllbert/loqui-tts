import { useAppStore } from '../../stores/appStore'
import { GlassSlider } from '../glass/GlassSlider'

export function ParameterPanel() {
  const {
    cfgWeight, setCfgWeight,
    exaggeration, setExaggeration,
    temperature, setTemperature,
  } = useAppStore()

  return (
    <div className="space-y-3">
      <label className="text-sm text-stone-600">Parameters</label>
      <GlassSlider label="Exaggeration" value={exaggeration} onChange={setExaggeration} min={0.25} max={2.0} step={0.05} />
      <GlassSlider label="CFG Weight" value={cfgWeight} onChange={setCfgWeight} />
      <GlassSlider label="Temperature" value={temperature} onChange={setTemperature} min={0.05} max={2.0} step={0.05} />
    </div>
  )
}
