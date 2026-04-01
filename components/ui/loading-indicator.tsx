'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/utils/cn'

interface LoadingIndicatorProps {
  className?: string
  size?: number
}

export default function LoadingIndicator({ className, size = 24 }: LoadingIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <CircleNotch
        weight="light"
        size={size}
        className="animate-spin text-muted-foreground"
      />
    </div>
  )
}
