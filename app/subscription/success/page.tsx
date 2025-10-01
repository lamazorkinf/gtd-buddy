"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle, ArrowRight, Loader2, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { modernTheme } from "@/lib/theme"
import { useToast } from "@/hooks/use-toast"

type PaymentStatus = "loading" | "success" | "pending" | "error"

export default function SubscriptionSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [status, setStatus] = useState<PaymentStatus>("loading")
  const [message, setMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Obtener parámetros de la URL
        const paymentId = searchParams.get("payment_id")
        const subscriptionId = searchParams.get("subscription_id") || searchParams.get("preapproval_id")
        const mpStatus = searchParams.get("status")
        const collectionStatus = searchParams.get("collection_status")

        console.log("🔍 Parámetros de retorno de MP:", {
          paymentId,
          subscriptionId,
          mpStatus,
          collectionStatus,
          userId: user?.uid,
        })

        if (!user?.uid) {
          setStatus("error")
          setMessage("Usuario no encontrado")
          return
        }

        // Verificar el pago con nuestro backend
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            paymentId,
            subscriptionId,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log("✅ Respuesta de verificación:", data)

          switch (data.subscriptionStatus) {
            case "active":
              setStatus("success")
              setMessage("¡Tu suscripción ha sido activada exitosamente!")
              // Mostrar toast de éxito
              toast({
                title: "🎉 ¡Suscripción Activada!",
                description: "Bienvenido a GTD Buddy Pro. Tu suscripción está activa.",
                duration: 5000,
              })
              // Redirigir al dashboard después de 3 segundos
              setTimeout(() => router.push("/"), 3000)
              break

            case "pending_payment":
              setStatus("pending")
              setMessage("Tu pago está siendo procesado. Te notificaremos cuando se confirme.")
              toast({
                title: "⏳ Pago Pendiente",
                description: "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
                duration: 5000,
              })
              break

            default:
              setStatus("pending")
              setMessage(`Estado: ${data.message || "Procesando pago..."}`)
          }
        } else {
          const errorData = await response.json()
          console.error("❌ Error en verificación:", errorData)

          // Reintentar hasta 3 veces si hay error
          if (retryCount < 3) {
            console.log(`🔄 Reintentando verificación (${retryCount + 1}/3)...`)
            setRetryCount((prev) => prev + 1)
            setTimeout(verifyPayment, 2000) // Reintentar en 2 segundos
            return
          }

          setStatus("error")
          setMessage("Error al verificar el pago. Por favor, contacta soporte.")
          toast({
            title: "❌ Error en el Pago",
            description: "No pudimos verificar tu pago. Por favor, contacta soporte.",
            variant: "destructive",
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("❌ Error en verifyPayment:", error)

        // Reintentar si hay error de red
        if (retryCount < 3) {
          console.log(`🔄 Reintentando por error de red (${retryCount + 1}/3)...`)
          setRetryCount((prev) => prev + 1)
          setTimeout(verifyPayment, 2000)
          return
        }

        setStatus("error")
        setMessage("Error de conexión. Por favor, verifica tu internet e intenta nuevamente.")
        toast({
          title: "❌ Error de Conexión",
          description: "No pudimos conectar con el servidor. Verifica tu internet.",
          variant: "destructive",
          duration: 5000,
        })
      }
    }

    if (user) {
      verifyPayment()
    } else {
      // Esperar a que el usuario se cargue
      const timeoutId = setTimeout(() => {
        if (user) {
          verifyPayment()
        } else {
          setStatus("error")
          setMessage("No se pudo cargar la información del usuario")
        }
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [searchParams, user, router, retryCount])

  const handleGoToDashboard = () => {
    router.push("/")
  }

  const handleRetry = () => {
    setStatus("loading")
    setRetryCount(0)
    // El useEffect se ejecutará nuevamente
  }

  const handleContactSupport = () => {
    // Aquí puedes agregar lógica para contactar soporte
    console.log("Contactar soporte")
  }

  if (status === "loading") {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
        <Card className={`w-full max-w-md mx-auto ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
          <CardContent className="text-center py-8">
            <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${modernTheme.colors.primaryText}`} />
            <h2 className={`text-xl font-semibold mb-2 ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>Verificando tu pago...</h2>
            <p className={modernTheme.colors.mutedForeground}>
              {retryCount > 0 ? `Reintentando (${retryCount}/3)...` : "Por favor espera un momento"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
        <Card className={`w-full max-w-md mx-auto ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className={`${modernTheme.typography.heading} text-red-600`}>Error en el Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={`${modernTheme.colors.cardRed} border ${modernTheme.container.radius}`}>
              <AlertDescription className={modernTheme.colors.textRed}>{message}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" className={`flex-1 ${modernTheme.effects.transition}`}>
                Reintentar
              </Button>
              <Button onClick={handleContactSupport} className={`flex-1 ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.effects.transition}`}>
                Contactar Soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
        <Card className={`w-full max-w-md mx-auto ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className={`${modernTheme.typography.heading} text-yellow-600`}>Pago Pendiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={`${modernTheme.colors.cardAmber} border ${modernTheme.container.radius}`}>
              <AlertDescription className={modernTheme.colors.textAmber}>{message}</AlertDescription>
            </Alert>
            <Button onClick={handleGoToDashboard} className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.effects.transition}`}>
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Status === "success"
  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
      <Card className={`w-full max-w-md mx-auto overflow-hidden ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
        <div className={`${modernTheme.colors.success} text-white p-8 text-center ${modernTheme.container.radius}`}>
          <CheckCircle className="h-20 w-20 mx-auto mb-4" />
          <h1 className={`text-3xl ${modernTheme.typography.heading}`}>¡Pago Exitoso!</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className={`text-2xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
            ¡Bienvenido a GTD Buddy Pro!
          </CardTitle>
          <CardDescription className={`${modernTheme.colors.mutedForeground} mt-2`}>{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <Alert className={`${modernTheme.colors.cardGreen} border ${modernTheme.container.radius}`}>
            <CheckCircle className={`h-4 w-4 ${modernTheme.colors.textGreen}`} />
            <AlertDescription className={modernTheme.colors.textGreen}>Serás redirigido automáticamente al dashboard en unos segundos...</AlertDescription>
          </Alert>

          <Button
            onClick={handleGoToDashboard}
            className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} font-medium py-3 text-lg ${modernTheme.effects.transition}`}
          >
            Ir al Dashboard Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
