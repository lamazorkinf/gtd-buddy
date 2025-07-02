"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

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
      initial={{ borderRadius: "0.75rem" }}
      className={isExpanded ? "md:col-span-3" : "md:col-span-1"}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <Card
        onClick={() => onPanelClick(panelId)}
        className={`cursor-pointer h-full transition-shadow hover:shadow-lg ${cardClassName}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <div className={`flex items-center gap-2 ${titleClassName}`}>
              {icon}
              <span>{title}</span>
            </div>
            <Badge
              variant="secondary"
              className={`transition-all ${badgeClassName} ${isExpanded ? "bg-white text-black" : ""}`}
            >
              {count}
            </Badge>
          </CardTitle>
        </CardHeader>
        {isExpanded && <CardContent>{children}</CardContent>}
      </Card>
    </motion.div>
  )
}
