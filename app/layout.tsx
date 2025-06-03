import type React from "react"
import type { Metadata } from "next"
import { Manrope, Sora } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import PageTransition from "@/components/transitions/page-transition"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})

export const metadata: Metadata = {
  title: "GTD Buddy - Getting Things Done",
  description: "Organiza tu vida con el método Getting Things Done",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${sora.variable} font-sans`}>
        <AuthProvider>
          <PageTransition>{children}</PageTransition>
        </AuthProvider>
      </body>
    </html>
  )
}
