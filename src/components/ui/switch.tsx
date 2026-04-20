'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-10 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary/60 data-[state=unchecked]:bg-zinc-500/70 data-[state=unchecked]:border-zinc-400/60 dark:data-[state=unchecked]:bg-zinc-700 dark:data-[state=unchecked]:border-zinc-600 focus-visible:border-ring focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={
          'pointer-events-none block size-4 rounded-full bg-white ring-0 shadow-sm transition-transform data-[state=checked]:translate-x-[1.1rem] data-[state=unchecked]:translate-x-0.5'
        }
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
