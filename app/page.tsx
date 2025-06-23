"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Dashboard from "@/components/dashboard/dashboard"
import LandingPage from "@/components/landing/landing-page"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, subscriptionStatus, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Wait for auth to finish loading

    if (!user) {
      // No user, show landing page
      return
    }

    // User exists, check subscription status
    if (!subscriptionStatus.canAccessDashboard) {
      console.log("Redirigiendo a suscripción:", subscriptionStatus.reason)
      router.push("/subscription")
      return
    }

    // User can access dashboard, continue showing it
  }, [user, subscriptionStatus, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gtd-clarity-500 mx-auto mb-4" />
          <p className="text-gtd-clarity-700 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  if (!subscriptionStatus.canAccessDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-lg">Verificando suscripción...</p>
        </div>
      </div>
    )
  }

  return <Dashboard />
}
