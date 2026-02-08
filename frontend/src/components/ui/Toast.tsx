import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export interface ToastData {
  id: string
  type: 'success' | 'error'
  message: string
  duration?: number
}

let addToastFn: ((toast: Omit<ToastData, 'id'>) => void) | null = null

export function toast(data: Omit<ToastData, 'id'>) {
  addToastFn?.(data)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...data, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(t.id), 300)
    }, t.duration || 4000)
    return () => clearTimeout(timer)
  }, [t.id, t.duration, onDismiss])

  const isSuccess = t.type === 'success'

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
        transition-all duration-300 ease-out min-w-[280px] max-w-[400px]
        ${isSuccess
          ? 'bg-white border-emerald-200'
          : 'bg-white border-red-200'}
        ${visible && !exiting
          ? 'opacity-100 translate-y-0 translate-x-0'
          : 'opacity-0 translate-y-2 translate-x-4'}
      `}
    >
      {isSuccess
        ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
        : <XCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
      }
      <span className="text-sm text-stone-700 flex-1">{t.message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(t.id), 300) }}
        className="p-0.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
