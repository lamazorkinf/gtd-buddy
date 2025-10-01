"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Zap, Waves, Sparkles } from "lucide-react"
import Link from "next/link"
import { modernTheme } from "@/lib/theme"

type AnimationType = "current" | "smooth" | "instant"

// Animación actual (la que se repite)
const currentVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  in: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    scale: 1.05,
    y: -20,
  },
}

const currentTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4,
}

// Opción 1: Suave y fluida
const smoothVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
}

const smoothTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.25,
}

// Opción 2: Instantánea (solo fade)
const instantVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
}

const instantTransition = {
  type: "tween" as const,
  ease: "linear" as const,
  duration: 0.15,
}

const animations = {
  current: {
    name: "Actual (Anticipate)",
    description: "Animación con escala y movimiento vertical. Puede dar sensación de doble animación.",
    icon: <Zap className="h-6 w-6" />,
    variants: currentVariants,
    transition: currentTransition,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  smooth: {
    name: "Suave y Fluida",
    description: "Solo movimiento vertical sutil con fade. Más profesional y menos distractora.",
    icon: <Waves className="h-6 w-6" />,
    variants: smoothVariants,
    transition: smoothTransition,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  instant: {
    name: "Instantánea",
    description: "Solo fade rápido, sin movimiento. Ideal para usuarios que prefieren menos animaciones.",
    icon: <Sparkles className="h-6 w-6" />,
    variants: instantVariants,
    transition: instantTransition,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
}

export default function AnimationsDemo() {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>("current")
  const [counter, setCounter] = useState(0)
  const animation = animations[selectedAnimation]

  const triggerAnimation = () => {
    setCounter((prev) => prev + 1)
  }

  return (
    <div className={`min-h-screen w-full ${modernTheme.colors.bg} p-6`}>
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText} mb-2`}>
              Demostración de Animaciones
            </h1>
            <p className={modernTheme.colors.mutedForeground}>
              Compara diferentes estilos de transición de página
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className={modernTheme.container.radius}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        {/* Selectores de Animación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(animations) as AnimationType[]).map((key) => {
            const anim = animations[key]
            return (
              <Card
                key={key}
                onClick={() => setSelectedAnimation(key)}
                className={`cursor-pointer transition-all ${modernTheme.container.radius} ${modernTheme.container.shadow} border-2 ${
                  selectedAnimation === key
                    ? `${modernTheme.colors.cardBorder} scale-105`
                    : "border-transparent hover:scale-102"
                } ${modernTheme.effects.glass}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 ${anim.bgColor} ${modernTheme.container.radius}`}>
                      <div className={anim.color}>{anim.icon}</div>
                    </div>
                    <span className={`text-lg ${modernTheme.colors.primaryText}`}>{anim.name}</span>
                  </CardTitle>
                  <CardDescription className={modernTheme.colors.mutedForeground}>
                    {anim.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Área de Prueba */}
        <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
          <CardHeader>
            <CardTitle className={`${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
              Vista Previa en Vivo
            </CardTitle>
            <CardDescription className={modernTheme.colors.mutedForeground}>
              Haz clic en "Probar Animación" para ver cómo se ve la transición
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Botón para probar */}
            <div className="flex justify-center">
              <Button
                onClick={triggerAnimation}
                className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius} px-8 py-3 text-lg`}
              >
                Probar Animación
              </Button>
            </div>

            {/* Contenedor de Animación */}
            <div className="min-h-[400px] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={counter}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={animation.variants}
                  transition={animation.transition}
                  className="w-full max-w-md"
                >
                  <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
                    <CardHeader className={`${animation.bgColor} border-b ${modernTheme.colors.cardBorder}`}>
                      <CardTitle className={`flex items-center gap-3 ${modernTheme.typography.heading}`}>
                        <div className={animation.color}>{animation.icon}</div>
                        <span>{animation.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className={`font-semibold ${modernTheme.colors.primaryText} mb-2`}>Características:</h3>
                        <ul className={`space-y-2 ${modernTheme.colors.mutedForeground} text-sm`}>
                          <li>• Duración: {animation.transition.duration}s</li>
                          <li>• Easing: {animation.transition.ease}</li>
                          <li>
                            • Efectos:{" "}
                            {Object.keys(animation.variants.initial).join(", ")}
                          </li>
                        </ul>
                      </div>
                      <div className={`p-4 ${modernTheme.effects.glass} ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
                        <p className={`text-sm ${modernTheme.colors.mutedForeground}`}>
                          Esta es una tarjeta de ejemplo que se anima cada vez que presionas el botón.
                          Observa cómo aparece y desaparece para evaluar la fluidez de la transición.
                        </p>
                      </div>
                      <div className="text-center">
                        <Badge className={`${animation.bgColor} ${animation.color} ${modernTheme.container.radius}`}>
                          Animación #{counter}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Recomendación */}
        <Card className={`${modernTheme.colors.cardBlue} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
          <CardHeader>
            <CardTitle className={`${modernTheme.typography.heading} ${modernTheme.colors.textBlue}`}>
              💡 Recomendación
            </CardTitle>
          </CardHeader>
          <CardContent className={`${modernTheme.colors.mutedForeground} space-y-3`}>
            <p>
              <strong>Opción Suave y Fluida</strong> es la más recomendada para aplicaciones de productividad:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Más rápida (0.25s vs 0.4s)</li>
              <li>• Menos distractora, no usa escala</li>
              <li>• Movimiento sutil que no marea</li>
              <li>• Profesional y moderna</li>
            </ul>
            <p className="text-sm mt-4">
              La animación <strong>Instantánea</strong> es ideal si prefieres que la app responda casi de inmediato,
              perfecta para usuarios avanzados o con preferencias de accesibilidad.
            </p>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" className={modernTheme.container.radius}>
              Cancelar
            </Button>
          </Link>
          <Button
            className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius}`}
            onClick={() => {
              alert(`Has seleccionado: ${animation.name}\n\nPara aplicar esta animación, modificaremos el archivo:\ncomponents/transitions/page-transition.tsx`)
            }}
          >
            Aplicar "{animation.name}"
          </Button>
        </div>
      </div>
    </div>
  )
}
