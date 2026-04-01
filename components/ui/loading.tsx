import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/utils/cn'

interface LoadingProps {
  className?: string
  /** Size of the spinner in px. Default 20. */
  size?: number
  /** Optional message shown below the spinner. */
  message?: string
}

export function Loading({ className, size = 20, message }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground', className)}>
      <CircleNotch weight="light" size={size} className="animate-spin" />
      {message && <p className="text-sm">{message}</p>}
    </div>
  )
}
