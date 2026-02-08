import { useAppStore } from '../../stores/appStore'
import { GlassSlider } from '../glass/GlassSlider'
import { isQwenVariant } from '../../utils/constants'
import { InfoTip } from '../ui/InfoTip'

export function ParameterPanel() {
  const {
    selectedVariant,
    temperature, setTemperature,
    speed, setSpeed,
  } = useAppStore()

  const isQwen = isQwenVariant(selectedVariant)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <label className="text-sm text-stone-600">Parameters</label>
        <InfoTip text="Fine-tune generation behavior. Higher temperature = more expressive and varied, lower = more consistent and predictable." />
      </div>
      <GlassSlider
        label="Temperature"
        hint="Controls randomness. Lower is more stable, higher is more expressive."
        value={temperature}
        onChange={setTemperature}
        min={0.05}
        max={2.0}
        step={0.05}
      />
      {isQwen && (
        <GlassSlider
          label="Speed"
          hint="Playback speed of generated speech. 1.0 is normal, 0.5 is half speed, 2.0 is double."
          value={speed}
          onChange={setSpeed}
          min={0.5}
          max={2.0}
          step={0.05}
        />
      )}
      {!isQwen && (
        <p className="text-xs text-stone-400">English models only use temperature</p>
      )}
    </div>
  )
}
