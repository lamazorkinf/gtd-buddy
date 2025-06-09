"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Dashboard from "@/components/dashboard/dashboard"
import LandingPage from "@/components/landing/landing-page"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Efecto para redirigir a usuarios sin suscripción activa
  useEffect(() => {
    if (user && !loading) {
      console.log("Usuario detectado:", {
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        showMessage: user.showMessage,
        isInTrialPeriod: user.isInTrialPeriod,
      })

      // Si el usuario no tiene suscripción activa NI está en período de prueba NI es usuario de test, redirigir a la página de suscripción
      if (
        (user.subscriptionStatus === "pending_payment" || user.subscriptionStatus === "inactive") &&
        !user.isInTrialPeriod &&
        user.role !== "test" &&
        user.subscriptionStatus !== "test"
      ) {
        console.log("Redirigiendo a subscription")
        router.push("/subscription")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando GTD Buddy...</p>
        </div>
      </div>
    )
  }

  if (user) {
    console.log("Evaluando acceso al dashboard:", {
      subscriptionStatus: user.subscriptionStatus,
      isInTrialPeriod: user.isInTrialPeriod,
      role: user.role,
    })

    // Si el usuario tiene suscripción activa O está en período de prueba O es usuario de test, mostrar el dashboard
    if (
      user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trial" ||
      user.subscriptionStatus === "test" ||
      user.isInTrialPeriod === true ||
      user.role === "test"
    ) {
      console.log("Mostrando Dashboard")
      return <Dashboard />
    }

    // Si el usuario no tiene acceso, la redirección se maneja en el useEffect
    // Mientras se procesa la redirección, mostrar pantalla de carga
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando acceso...</p>
        </div>
      </div>
    )
  } else {
    return <LandingPage />
  }
}
