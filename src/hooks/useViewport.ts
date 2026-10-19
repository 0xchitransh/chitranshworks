import { useSyncExternalStore } from 'react'

/** Below this width the content panel becomes a bottom sheet. */
export const MOBILE_BREAKPOINT = 900
/** At or above this width the persistent left navigation rail is shown. */
export const RAIL_BREAKPOINT = 1100
export const RAIL_WIDTH = 236

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  )
}

export function useHasRail(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth >= RAIL_BREAKPOINT,
    () => true,
  )
}
