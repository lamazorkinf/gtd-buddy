// Modern Glassmorphism Theme Configuration
// Using GTD Buddy Design Tokens
export const modernTheme = {
  name: "Modern Glassmorphism",
  typography: {
    heading: "font-sans font-bold",
    body: "font-sans",
  },
  colors: {
    // Base
    bg: "gtd-gradient-bg",

    // Glassmorphism
    card: "glassmorphism",
    cardHover: "hover:bg-white/50",
    cardBorder: "border-white/50",

    // Semantic Colors
    primary: "bg-gradient-to-r from-gtd-clarity to-gtd-action text-white",
    primaryHover: "hover:from-gtd-clarity-dark hover:to-gtd-action-dark",
    primaryText: "text-gtd-clarity-dark",

    secondary: "bg-white/60 text-gtd-clarity-dark",
    secondaryHover: "hover:bg-white/70",

    accent: "bg-gradient-to-r from-gtd-focus to-gtd-clarity",

    muted: "text-gtd-clarity",
    mutedForeground: "text-gtd-clarity-dark/70",

    success: "bg-gradient-to-r from-gtd-confidence to-emerald-500",

    // GTD Category Cards
    cardInbox: "bg-gtd-inbox-bg/10 border-gtd-inbox/30 backdrop-blur-xl",
    cardNext: "bg-gtd-next-bg/10 border-gtd-next/30 backdrop-blur-xl",
    cardProject: "bg-gtd-project-bg/10 border-gtd-project/30 backdrop-blur-xl",
    cardWaiting: "bg-gtd-waiting-bg/10 border-gtd-waiting/30 backdrop-blur-xl",
    cardSomeday: "bg-gtd-someday-bg/10 border-gtd-someday/30 backdrop-blur-xl",

    // Legacy names for backwards compatibility
    cardBlue: "bg-gtd-next-bg/10 border-gtd-next/30 backdrop-blur-xl",
    cardRed: "bg-red-500/10 border-red-300/30 backdrop-blur-xl",
    cardAmber: "bg-gtd-someday-bg/10 border-gtd-someday/30 backdrop-blur-xl",
    cardGreen: "bg-gtd-next-bg/10 border-gtd-next/30 backdrop-blur-xl",
    cardPurple: "bg-gtd-project-bg/10 border-gtd-project/30 backdrop-blur-xl",
    cardOrange: "bg-gtd-waiting-bg/10 border-gtd-waiting/30 backdrop-blur-xl",

    // Text colors for GTD categories
    textInbox: "text-gtd-inbox",
    textNext: "text-gtd-next",
    textProject: "text-gtd-project",
    textWaiting: "text-gtd-waiting",
    textSomeday: "text-gtd-someday",

    // Legacy text colors
    textBlue: "text-gtd-next",
    textRed: "text-red-700",
    textAmber: "text-gtd-someday",
    textGreen: "text-gtd-next",
    textPurple: "text-gtd-project",
    textOrange: "text-gtd-waiting",

    // Badge colors for GTD categories
    badgeInbox: "bg-gtd-inbox-light/60 text-gtd-inbox border-gtd-inbox/50",
    badgeNext: "bg-gtd-next-light/60 text-gtd-next border-gtd-next/50",
    badgeProject: "bg-gtd-project-light/60 text-gtd-project border-gtd-project/50",
    badgeWaiting: "bg-gtd-waiting-light/60 text-gtd-waiting border-gtd-waiting/50",
    badgeSomeday: "bg-gtd-someday-light/60 text-gtd-someday border-gtd-someday/50",
    badgeCompleted: "bg-gtd-confidence-light/60 text-gtd-completed border-gtd-completed/50",
    badgeOverdue: "bg-red-200/60 text-gtd-overdue border-gtd-overdue/50",

    // Legacy badge colors
    badgeBlue: "bg-gtd-next-light/60 text-gtd-next border-gtd-next/50",
    badgeRed: "bg-red-200/60 text-gtd-overdue border-gtd-overdue/50",
    badgeAmber: "bg-gtd-someday-light/60 text-gtd-someday border-gtd-someday/50",
    badgeGreen: "bg-gtd-confidence-light/60 text-gtd-completed border-gtd-completed/50",
    badgePurple: "bg-gtd-project-light/60 text-gtd-project border-gtd-project/50",
    badgeOrange: "bg-gtd-waiting-light/60 text-gtd-waiting border-gtd-waiting/50",
  },
  container: {
    radius: "rounded-2xl",
    shadow: "shadow-2xl shadow-gtd-clarity-light/50",
    shadowMd: "shadow-xl shadow-gtd-clarity-light/30",
    shadowSm: "shadow-lg shadow-gtd-clarity-light/40",
  },
  effects: {
    glass: "glassmorphism",
    glassHover: "hover:backdrop-blur-2xl hover:bg-white/50",
    ring: "ring-2 ring-gtd-clarity/50",
    transition: "transition-all duration-300",
  },
}

export type Theme = typeof modernTheme
