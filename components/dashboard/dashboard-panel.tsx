"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { modernTheme } from "@/lib/theme"

interface DashboardPanelProps {
  panelId: string
  title: string
  icon: ReactNode
  count: number
  expandedPanel: string | null
  onPanelClick: (panelId: string) => void
  children: ReactNode
  cardClassName?: string
  titleClassName?: string
  badgeClassName?: string
}

export function DashboardPanel({
  panelId,
  title,
  icon,
  count,
  expandedPanel,
  onPanelClick,
  children,
  cardClassName,
  titleClassName,
  badgeClassName,
}: DashboardPanelProps) {
  const isExpanded = expandedPanel === panelId

  return (
    <motion.div
      layout
      initial={{ borderRadius: "1rem" }}
      className={isExpanded ? "md:col-span-3" : "md:col-span-1"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Card
        onClick={() => onPanelClick(panelId)}
        className={`cursor-pointer h-full ${modernTheme.effects.transition} ${modernTheme.effects.glassHover} hover:scale-[1.02] ${cardClassName} ${
          isExpanded ? `${modernTheme.effects.ring}` : ""
        }`}
      >
        <CardHeader>
          <CardTitle className={`flex items-center justify-between text-base ${modernTheme.typography.heading}`}>
            <div className={`flex items-center gap-2 ${titleClassName}`}>
              {icon}
              <span>{title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`${modernTheme.effects.transition} ${badgeClassName} ${isExpanded ? "bg-white text-purple-700" : ""}`}
              >
                {count}
              </Badge>
              {isExpanded ? (
                <ChevronUp className={`h-4 w-4 ${modernTheme.colors.muted}`} />
              ) : (
                <ChevronDown className={`h-4 w-4 ${modernTheme.colors.muted}`} />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        {isExpanded && <CardContent>{children}</CardContent>}
      </Card>
    </motion.div>
  )
}
