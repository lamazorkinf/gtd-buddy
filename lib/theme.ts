// Modern Glassmorphism Theme Configuration
export const modernTheme = {
  name: "Modern Glassmorphism",
  typography: {
    heading: "font-sans font-bold",
    body: "font-sans",
  },
  colors: {
    bg: "bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100",
    card: "bg-white/40 backdrop-blur-xl",
    cardHover: "hover:bg-white/50",
    cardBorder: "border-white/50",
    primary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    primaryHover: "hover:from-purple-600 hover:to-pink-600",
    primaryText: "text-purple-700",
    secondary: "bg-white/60 text-purple-700",
    secondaryHover: "hover:bg-white/70",
    accent: "bg-gradient-to-r from-blue-500 to-purple-500",
    muted: "text-purple-400",
    mutedForeground: "text-purple-600/70",
    success: "bg-gradient-to-r from-green-400 to-emerald-500",
    // Card variants for different sections
    cardBlue: "bg-blue-500/10 border-blue-300/30 backdrop-blur-xl",
    cardRed: "bg-red-500/10 border-red-300/30 backdrop-blur-xl",
    cardAmber: "bg-amber-500/10 border-amber-300/30 backdrop-blur-xl",
    cardGreen: "bg-green-500/10 border-green-300/30 backdrop-blur-xl",
    cardPurple: "bg-purple-500/10 border-purple-300/30 backdrop-blur-xl",
    cardOrange: "bg-orange-500/10 border-orange-300/30 backdrop-blur-xl",
    // Text colors for cards
    textBlue: "text-blue-700",
    textRed: "text-red-700",
    textAmber: "text-amber-700",
    textGreen: "text-green-700",
    textPurple: "text-purple-700",
    textOrange: "text-orange-700",
    // Badge colors
    badgeBlue: "bg-blue-200/60 text-blue-800 border-blue-300/50",
    badgeRed: "bg-red-200/60 text-red-800 border-red-300/50",
    badgeAmber: "bg-amber-200/60 text-amber-800 border-amber-300/50",
    badgeGreen: "bg-green-200/60 text-green-800 border-green-300/50",
    badgePurple: "bg-purple-200/60 text-purple-800 border-purple-300/50",
    badgeOrange: "bg-orange-200/60 text-orange-800 border-orange-300/50",
  },
  container: {
    radius: "rounded-2xl",
    shadow: "shadow-2xl shadow-purple-200/50",
    shadowMd: "shadow-xl shadow-purple-200/30",
    shadowSm: "shadow-lg shadow-purple-100/40",
  },
  effects: {
    glass: "backdrop-blur-xl bg-white/40",
    glassHover: "hover:backdrop-blur-2xl hover:bg-white/50",
    ring: "ring-2 ring-purple-300/50",
    transition: "transition-all duration-300",
  },
}

export type Theme = typeof modernTheme
