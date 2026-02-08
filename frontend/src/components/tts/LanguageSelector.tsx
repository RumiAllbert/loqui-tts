import { useAppStore } from '../../stores/appStore'
import { GlassSelect } from '../glass/GlassSelect'
import { LANGUAGES } from '../../utils/constants'

export function LanguageSelector() {
  const { selectedVariant, language, setLanguage } = useAppStore()

  if (selectedVariant !== 'multilingual') return null

  const options = Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))

  return <GlassSelect label="Language" value={language} onChange={setLanguage} options={options} />
}
