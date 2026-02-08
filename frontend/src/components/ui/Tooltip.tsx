import { useState } from 'react'

interface Props {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ text, children, position = 'top' }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          className={`
            absolute z-50 left-1/2 -translate-x-1/2 px-3 py-2 text-xs text-white bg-stone-800
            rounded-lg shadow-lg max-w-[260px] w-max pointer-events-none leading-relaxed
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          {text}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${position === 'top' ? 'top-full -mt-px border-t-stone-800' : 'bottom-full -mb-px border-b-stone-800'}
            `}
          />
        </div>
      )}
    </div>
  )
}
