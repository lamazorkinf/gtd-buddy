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
  const [paymentVerified, setPaymentVerified] = useState(false)

  useEffect(() => {
    // Simular verificación de pago
    const verifyPayment = async () => {
      try {
        const paymentId = searchParams.get("payment_id")
        const status = searchParams.get("status")

        console.log("🔍 Verificando pago:", { paymentId, status })

        // Llamar al endpoint de verificación
        if (user?.uid) {
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.uid }),
          })

          if (response.ok) {
            const data = await response.json()
            setPaymentVerified(data.subscriptionStatus === "active")
            console.log("✅ Pago verificado:", data)
          } else {
            console.error("❌ Error verificando pago")
          }
        }
      } catch (error) {
        console.error("❌ Error verificando pago:", error)
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, user?.uid])

  const handleGoToDashboard = () => {
    router.push("/")
  }

  const handleViewSubscriptionDetails = () => {
    // Aquí podrías redirigir a una página de detalles de suscripción
    console.log("Ver detalles de suscripción")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
        {/* Header verde con ícono de éxito */}
        <div className="bg-green-500 text-white p-6 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">¡Pago Exitoso!</h1>
        </div>

        {/* Contenido principal */}
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900">¡Bienvenido a GTD Buddy Pro!</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Tu suscripción ha sido activada exitosamente. Ya puedes disfrutar de todas las funcionalidades premium.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-medium py-3"
          >
            Ir al Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <button
            onClick={handleViewSubscriptionDetails}
            className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium py-2"
          >
            Ver Detalles de Suscripción
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
