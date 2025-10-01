"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Inbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { modernTheme } from "@/lib/theme"

interface InboxBadgeProps {
  count: number
  onClick: () => void
}

export function InboxBadge({ count, onClick }: InboxBadgeProps) {
  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={onClick}
          className={`flex items-center gap-3 ${modernTheme.colors.primary} px-5 py-3 rounded-full ${modernTheme.container.shadow} hover:shadow-2xl ${modernTheme.effects.transition} hover:scale-105 active:scale-95 ${modernTheme.effects.glass}`}
        >
          <Inbox className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium opacity-90">Inbox</span>
            <span className={`text-sm ${modernTheme.typography.heading}`}>{count} pendientes</span>
          </div>
          <Badge className={`bg-white ${modernTheme.colors.primaryText} hover:bg-white ${modernTheme.typography.heading}`}>{count}</Badge>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
