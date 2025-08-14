"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeLogo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return light theme logo by default to avoid hydration mismatch
    return (
      <img
        src="/firecrawl-logo-with-fire.webp"
        alt="Firecrawl"
        className="h-8 w-auto"
      />
    )
  }

  const logoSrc = theme === "dark" 
    ? "/firecrawl-logo-with-fire-dark.webp" 
    : "/firecrawl-logo-with-fire.webp"

  return (
    <img
      src={logoSrc}
      alt="Firecrawl"
      className="h-8 w-auto"
    />
  )
}
