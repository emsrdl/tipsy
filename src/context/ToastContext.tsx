/**
 * @file src/context/ToastContext.tsx
 * @description Simple Material-style toast notification system.
 *
 * Provides a toast queue with auto-dismiss after 3.5s.
 * Toast types: success, error, warning, info.
 *
 * @example
 * const { showToast } = useToast()
 * showToast('Schicht gespeichert', 'success')
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'bg-status-success text-white',
  error:   'bg-status-error text-white',
  warning: 'bg-status-warning text-white',
  info:    'bg-accent text-accent-foreground',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-elevation-4',
        'text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200',
        'cursor-pointer min-w-[240px] max-w-[90vw]',
        TYPE_STYLES[toast.type]
      )}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id) }}
        className="opacity-80 hover:opacity-100 p-0.5"
        aria-label="Schließen"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — bottom center */}
      <div
        aria-live="polite"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
