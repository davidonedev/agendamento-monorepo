import * as React from "react"
import { AlertCircle, CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error"

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastItem extends ToastOptions {
  id: number
}

const ToastContext = React.createContext<((options: ToastOptions) => void) | null>(null)

const DURATION: Record<ToastVariant, number> = { success: 4000, error: 7000 }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const nextId = React.useRef(0)
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = React.useCallback((options: ToastOptions) => {
    const id = nextId.current++
    setItems(prev => [...prev, { ...options, id }])
    timers.current.set(id, setTimeout(() => dismiss(id), DURATION[options.variant ?? "success"]))
  }, [dismiss])

  React.useEffect(() => {
    const active = timers.current
    return () => active.forEach(clearTimeout)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {items.map(item => {
          const isError = item.variant === "error"
          const Icon = isError ? AlertCircle : CheckCircle2
          return (
            <div
              key={item.id}
              role={isError ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-lg",
                isError && "border-destructive/50"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  isError ? "text-destructive" : "text-green-600 dark:text-green-400"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-sm opacity-60 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const toast = React.useContext(ToastContext)
  if (!toast) throw new Error("useToast must be used inside ToastProvider")
  return { toast }
}
