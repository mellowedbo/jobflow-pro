import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useSyncExternalStore } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hydration-safe hook: returns false during SSR, true on client after mount
const emptySubscribe = () => () => {}
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
