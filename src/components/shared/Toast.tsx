import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

let toastListeners: ((toast: ToastData) => void)[] = []

export function showToast(
  message: string,
  type: ToastData['type'] = 'info',
  duration = 3000
) {
  const toast: ToastData = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
    duration,
  }
  toastListeners.forEach((listener) => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    const listener = (toast: ToastData) => {
      setToasts((prev) => [...prev, toast])
    }
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData
  onRemove: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 3000)
    return () => clearTimeout(timer)
  }, [toast.duration, onRemove])

  const Icon =
    toast.type === 'success'
      ? CheckCircle
      : toast.type === 'error'
        ? AlertCircle
        : Info

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border min-w-[300px]',
        {
          'bg-green-500/10 border-green-500/20 text-green-400':
            toast.type === 'success',
          'bg-red-500/10 border-red-500/20 text-red-400':
            toast.type === 'error',
          'bg-dark-700 border-gray-600 text-gray-300': toast.type === 'info',
        }
      )}
    >
      <Icon size={18} />
      <span className="text-sm flex-1">{toast.message}</span>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
