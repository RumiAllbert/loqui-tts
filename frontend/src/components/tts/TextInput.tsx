import { useAppStore } from '../../stores/appStore'
import { GlassInput } from '../glass/GlassInput'
import { MAX_TEXT_LENGTH } from '../../utils/constants'

export function TextInput() {
  const { text, setText } = useAppStore()

  return (
    <GlassInput
      label="Text"
      placeholder="Type or paste the text you'd like to hear spoken..."
      value={text}
      onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
      charCount={text.length}
      maxChars={MAX_TEXT_LENGTH}
    />
  )
}
