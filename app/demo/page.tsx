"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, ArrowRight, Plus, Check } from "lucide-react"
import Link from "next/link"

type Theme = "minimal" | "modern" | "warm" | "dark"

const themes = {
  minimal: {
    name: "Minimalista Zen",
    description: "Limpio, espacioso y enfocado en la claridad mental",
    typography: {
      heading: "font-serif",
      body: "font-sans",
    },
    colors: {
      bg: "bg-stone-50",
      card: "bg-white",
      cardBorder: "border-stone-200",
      primary: "bg-stone-900 text-white",
      primaryText: "text-stone-900",
      secondary: "bg-stone-100 text-stone-700",
      accent: "bg-stone-700",
      muted: "text-stone-500",
    },
    container: {
      radius: "rounded-none",
      shadow: "shadow-none border",
    },
  },
  modern: {
    name: "Modern Glassmorphism",
    description: "Efectos de vidrio esmerilado con gradientes vibrantes",
    typography: {
      heading: "font-sans font-bold",
      body: "font-sans",
    },
    colors: {
      bg: "bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100",
      card: "bg-white/40 backdrop-blur-xl",
      cardBorder: "border-white/50",
      primary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      primaryText: "text-purple-700",
      secondary: "bg-white/60 text-purple-700",
      accent: "bg-gradient-to-r from-blue-500 to-purple-500",
      muted: "text-purple-400",
    },
    container: {
      radius: "rounded-2xl",
      shadow: "shadow-2xl shadow-purple-200/50",
    },
  },
  warm: {
    name: "Warm & Cozy",
    description: "Tonos cálidos y acogedores inspirados en el otoño",
    typography: {
      heading: "font-serif",
      body: "font-serif",
    },
    colors: {
      bg: "bg-gradient-to-br from-orange-50 to-amber-50",
      card: "bg-gradient-to-br from-orange-100/80 to-amber-100/80",
      cardBorder: "border-orange-300/50",
      primary: "bg-gradient-to-r from-orange-600 to-amber-600 text-white",
      primaryText: "text-orange-800",
      secondary: "bg-orange-200/60 text-orange-800",
      accent: "bg-orange-500",
      muted: "text-orange-600/70",
    },
    container: {
      radius: "rounded-3xl",
      shadow: "shadow-lg shadow-orange-200/50",
    },
  },
  dark: {
    name: "Dark Mode Pro",
    description: "Elegante modo oscuro con acentos neón",
    typography: {
      heading: "font-mono font-bold",
      body: "font-mono",
    },
    colors: {
      bg: "bg-slate-950",
      card: "bg-slate-900",
      cardBorder: "border-slate-800",
      primary: "bg-cyan-500 text-slate-950",
      primaryText: "text-cyan-400",
      secondary: "bg-slate-800 text-cyan-300",
      accent: "bg-cyan-500",
      muted: "text-slate-500",
    },
    container: {
      radius: "rounded-lg",
      shadow: "shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/20",
    },
  },
}

export default function DemoPage() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>("minimal")
  const theme = themes[selectedTheme]

  return (
    <div className={`min-h-screen ${theme.colors.bg} transition-all duration-500`}>
      {/* Header */}
      <header className={`${theme.colors.card} ${theme.container.shadow} ${theme.colors.cardBorder} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard">
              <h1 className={`text-2xl ${theme.typography.heading} ${theme.colors.primaryText}`}>GTD Buddy</h1>
            </Link>
            <div className="flex items-center gap-3">
              <Button className={`${theme.colors.primary} ${theme.container.radius}`}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Theme Selector */}
        <div className="mb-8">
          <h2 className={`text-3xl ${theme.typography.heading} ${theme.colors.primaryText} mb-4`}>
            Selector de Estética
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(Object.keys(themes) as Theme[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => setSelectedTheme(themeKey)}
                className={`p-4 text-left transition-all ${themes[themeKey].container.radius} ${
                  selectedTheme === themeKey
                    ? `${themes[themeKey].colors.card} ${themes[themeKey].container.shadow} ${themes[themeKey].colors.cardBorder} border-2 scale-105`
                    : `${themes[themeKey].colors.secondary} opacity-60 hover:opacity-100`
                }`}
              >
                <h3 className={`font-bold mb-1 ${themes[themeKey].colors.primaryText}`}>{themes[themeKey].name}</h3>
                <p className={`text-xs ${themes[themeKey].colors.muted}`}>{themes[themeKey].description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Capture Demo */}
        <div className="mb-8">
          <Card
            className={`${theme.colors.card} ${theme.container.shadow} ${theme.colors.cardBorder} border ${theme.container.radius}`}
          >
            <CardContent className="p-4">
              <div className={`flex items-center gap-2 mb-3 ${theme.typography.body}`}>
                <span className="text-xl">⚡</span>
                <span className={`font-medium ${theme.colors.primaryText}`}>Captura Rápida</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="¿Qué tienes en mente?"
                  className={`flex-1 ${theme.container.radius} ${theme.typography.body}`}
                />
                <Button className={`${theme.colors.primary} ${theme.container.radius}`}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Cards Demo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Para Hoy */}
          <Card
            className={`${theme.colors.card} ${theme.container.shadow} ${theme.colors.cardBorder} border ${theme.container.radius}`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center justify-between text-base ${theme.typography.heading} ${theme.colors.primaryText}`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Para Hoy
                </div>
                <Badge className={`${theme.colors.secondary} ${theme.container.radius}`}>3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`p-2 ${theme.colors.secondary} ${theme.container.radius} flex items-start gap-3`}
                  >
                    <Checkbox className="mt-1" />
                    <span className={`text-sm ${theme.typography.body}`}>Tarea de ejemplo #{i}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Urgente */}
          <Card
            className={`${theme.colors.card} ${theme.container.shadow} ${theme.colors.cardBorder} border ${theme.container.radius}`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center justify-between text-base ${theme.typography.heading} ${theme.colors.primaryText}`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Urgente
                </div>
                <Badge className={`${theme.colors.secondary} ${theme.container.radius}`}>1</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`p-2 ${theme.colors.secondary} ${theme.container.radius} flex items-start gap-3`}>
                  <Checkbox className="mt-1" />
                  <span className={`text-sm ${theme.typography.body}`}>Tarea urgente importante</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximas Acciones */}
          <Card
            className={`${theme.colors.card} ${theme.container.shadow} ${theme.colors.cardBorder} border ${theme.container.radius}`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center justify-between text-base ${theme.typography.heading} ${theme.colors.primaryText}`}
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Próximas Acciones
                </div>
                <Badge className={`${theme.colors.secondary} ${theme.container.radius}`}>5</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={`p-2 ${theme.colors.secondary} ${theme.container.radius} flex items-start gap-3`}
                  >
                    <Checkbox className="mt-1" />
                    <span className={`text-sm ${theme.typography.body}`}>Próxima acción #{i}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Details */}
        <div className="mt-8">
          <Card
            className={`${theme.colors.card} ${theme.container.shadow} ${theme.colors.cardBorder} border ${theme.container.radius}`}
          >
            <CardHeader>
              <CardTitle className={`${theme.typography.heading} ${theme.colors.primaryText}`}>
                Detalles de la Estética: {theme.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${theme.typography.body}`}>
                <div>
                  <h4 className={`font-bold mb-2 ${theme.colors.primaryText}`}>Tipografía</h4>
                  <p className={theme.colors.muted}>
                    Encabezados: {theme.typography.heading.replace("font-", "")}
                  </p>
                  <p className={theme.colors.muted}>Cuerpo: {theme.typography.body.replace("font-", "")}</p>
                </div>
                <div>
                  <h4 className={`font-bold mb-2 ${theme.colors.primaryText}`}>Contenedores</h4>
                  <p className={theme.colors.muted}>Radio: {theme.container.radius.replace("rounded-", "")}</p>
                  <p className={theme.colors.muted}>Sombra: {theme.container.shadow.includes("shadow-") ? "Sí" : "No"}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className={`${theme.colors.primary} ${theme.container.radius} w-full`}
                  onClick={() => alert("Estética seleccionada: " + theme.name)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aplicar esta estética
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="outline" className={`${theme.container.radius} ${theme.typography.body}`}>
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
