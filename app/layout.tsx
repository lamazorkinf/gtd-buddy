import type React from "react"
import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { TeamProvider } from "@/contexts/team-context"
import PageTransition from "@/components/transitions/page-transition"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "GTD Buddy - Tu mente libre, tu sistema claro",
  description: "Captura. Decide. Avanza. Organiza tu vida con el método Getting Things Done",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans gtd-gradient-bg`}>
        <AuthProvider>
          <TeamProvider>
            <PageTransition>{children}</PageTransition>
            <Toaster />
          </TeamProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
