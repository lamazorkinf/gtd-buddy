"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubscriptionSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  // const [paymentVerified, setPaymentVerified] = useState(false) // No longer directly used for display

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paymentId = searchParams.get("payment_id") // Example, might be different based on MP response
        const status = searchParams.get("status")

        console.log("🔍 Verificando pago en success page:", { paymentId, status, userId: user?.uid })

        if (user?.uid) {
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.uid }),
          })

          if (response.ok) {
            const data = await response.json()
            // setPaymentVerified(data.subscriptionStatus === "active") // Update state if needed
            console.log("✅ Pago verificado en success page:", data)
            // The AuthProvider will re-fetch user data and redirect if status is active
            // Forcing a reload or a slight delay might help if AuthProvider isn't picking up changes immediately
            // setTimeout(() => router.push("/"), 1000); // Or rely on AuthProvider
          } else {
            console.error("❌ Error verificando pago en success page")
            // Handle error, maybe redirect to failure or show message
          }
        }
      } catch (error) {
        console.error("❌ Error en verifyPayment (success page):", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      // Only verify if user is available
      verifyPayment()
    } else {
      // If user is not yet available, wait for AuthProvider to load it.
      // This page might be hit before AuthProvider has fully initialized the user.
      // A small delay or a listener for user state change might be needed.
      const timeoutId = setTimeout(() => {
        if (user)
          verifyPayment() // Retry if user becomes available
        else setLoading(false) // If still no user, stop loading to show content
      }, 1500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchParams, user, router])

  const handleGoToDashboard = () => {
    router.push("/")
  }

  const handleViewSubscriptionDetails = () => {
    // Placeholder: Redirect to a future subscription management page
    console.log("Ver detalles de suscripción (placeholder)")
    // router.push("/account/subscription-details");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gtd-clarity-500 mx-auto mb-4" />
          <p className="text-gtd-clarity-700 text-lg">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-xl rounded-xl bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
        <div className="bg-gtd-confidence-500 text-white p-8 text-center">
          <CheckCircle className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-heading">¡Pago Exitoso!</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className="text-2xl font-bold text-gtd-neutral-800 font-heading">
            ¡Bienvenido a GTD Buddy Pro!
          </CardTitle>
          <CardDescription className="text-gtd-neutral-600 mt-2">
            Tu suscripción ha sido activada. Ya puedes disfrutar de todas las funcionalidades premium.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-gtd-clarity-500 via-gtd-action-500 to-gtd-focus-500 hover:from-gtd-clarity-600 hover:via-gtd-action-600 hover:to-gtd-focus-600 text-white font-medium py-3 text-lg"
          >
            Ir al Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            onClick={handleViewSubscriptionDetails}
            variant="outline"
            className="w-full border-gtd-neutral-300 text-gtd-neutral-700 hover:bg-gtd-neutral-100 py-3"
          >
            Ver Detalles de Suscripción
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
