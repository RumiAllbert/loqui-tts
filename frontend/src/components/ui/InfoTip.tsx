import { Info } from 'lucide-react'
import { Tooltip } from './Tooltip'

interface Props {
  text: string
  position?: 'top' | 'bottom'
}

export function InfoTip({ text, position = 'top' }: Props) {
  return (
    <Tooltip text={text} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-help">
        <Info className="w-3 h-3" />
      </span>
    </Tooltip>
  )
}
