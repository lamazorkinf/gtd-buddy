"use client"

import { useState, useEffect } from 'react'

/**
 * Hook para detectar media queries de forma responsive
 * @param query Media query string (ej: '(max-width: 640px)')
 * @returns true si la media query coincide, false si no
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create event listener
    const listener = () => setMatches(media.matches)

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * Hook de conveniencia para detectar el tipo de dispositivo
 * @returns Object con flags para mobile, tablet, desktop
 */
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch: isMobile || isTablet,
  }
}
