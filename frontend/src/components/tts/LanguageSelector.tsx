import { useAppStore } from '../../stores/appStore'
import { GlassSelect } from '../glass/GlassSelect'
import { LANGUAGES, isQwenVariant } from '../../utils/constants'
import { InfoTip } from '../ui/InfoTip'

export function LanguageSelector() {
  const { selectedVariant, language, setLanguage } = useAppStore()

  if (!isQwenVariant(selectedVariant)) return null

  const options = Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))

  return (
    <GlassSelect
      label="Language"
      labelExtra={<InfoTip text="Select the language of the text you want to synthesize. The model will generate speech in this language." />}
      value={language}
      onChange={setLanguage}
      options={options}
    />
  )
}
