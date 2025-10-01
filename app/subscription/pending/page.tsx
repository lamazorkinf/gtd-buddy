"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Clock, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { modernTheme } from "@/lib/theme"
import { useToast } from "@/hooks/use-toast"

export default function SubscriptionPendingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutos en segundos
  const [isChecking, setIsChecking] = useState(false)
  const [paymentResolved, setPaymentResolved] = useState(false)
  const [toastShown, setToastShown] = useState(false)

  useEffect(() => {
    // Mostrar toast al cargar la página (solo una vez)
    if (!toastShown) {
      toast({
        title: "⏳ Pago Pendiente",
        description: "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
        duration: 5000,
      })
      setToastShown(true)
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Podrías redirigir o mostrar un mensaje de "tiempo agotado"
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Función para verificar el estado del pago
    const checkPaymentStatus = async () => {
      if (!user?.uid || isChecking || paymentResolved) return
      
      setIsChecking(true)
      try {
        const paymentId = searchParams.get("payment_id")
        const subscriptionId = searchParams.get("subscription_id") || searchParams.get("preapproval_id")
        
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
          console.log("🔍 Estado verificado:", data.subscriptionStatus)
          
          if (data.subscriptionStatus === "active") {
            setPaymentResolved(true)
            toast({
              title: "✅ ¡Pago Confirmado!",
              description: "Tu suscripción ha sido activada. Redirigiendo...",
              duration: 3000,
            })
            setTimeout(() => router.push("/subscription/success"), 1000)
          } else if (data.subscriptionStatus === "cancelled") {
            setPaymentResolved(true)
            toast({
              title: "❌ Pago Cancelado",
              description: "El pago fue cancelado. Redirigiendo...",
              variant: "destructive",
              duration: 3000,
            })
            setTimeout(() => router.push("/subscription/failure"), 1000)
          }
        }
      } catch (error) {
        console.error("❌ Error verificando estado:", error)
      } finally {
        setIsChecking(false)
      }
    }

    // Auto-refresh cada 30 segundos para verificar el estado
    const refreshTimer = setInterval(checkPaymentStatus, 30000)
    
    // Verificar inmediatamente al cargar
    if (user) {
      checkPaymentStatus()
    }

    return () => {
      clearInterval(timer)
      clearInterval(refreshTimer)
    }
  }, [user, isChecking, paymentResolved, searchParams, router, toast, toastShown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleRefresh = async () => {
    if (!user?.uid || isChecking) return
    
    setIsChecking(true)
    try {
      const paymentId = searchParams.get("payment_id")
      const subscriptionId = searchParams.get("subscription_id") || searchParams.get("preapproval_id")
      
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
        if (data.subscriptionStatus === "active") {
          setPaymentResolved(true)
          router.push("/subscription/success")
        } else if (data.subscriptionStatus === "cancelled") {
          setPaymentResolved(true)
          router.push("/subscription/failure")
        }
      }
    } catch (error) {
      console.error("❌ Error en refresh:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
      <Card className={`w-full max-w-md mx-auto overflow-hidden ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white p-8 text-center">
          <Clock className="h-20 w-20 mx-auto mb-4" />
          <h1 className={`text-3xl ${modernTheme.typography.heading}`}>Pago Pendiente</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className={`text-2xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>Verificando tu Pago</CardTitle>
          <CardDescription className={`${modernTheme.colors.mutedForeground} mt-2`}>
            Tu pago está siendo procesado. Esto puede tomar unos minutos. Te notificaremos cuando esté listo.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <div className={`${modernTheme.colors.cardAmber} border ${modernTheme.container.radius} p-4 text-center`}>
            <p className={`text-sm ${modernTheme.colors.textAmber} mb-2`}>Tiempo estimado de verificación:</p>
            <p className={`text-3xl ${modernTheme.typography.heading} ${modernTheme.colors.textAmber}`}>{formatTime(timeLeft)}</p>
          </div>

          <div className={`text-sm ${modernTheme.colors.mutedForeground} space-y-2 ${modernTheme.effects.glass} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
            <p className={`font-medium ${modernTheme.colors.primaryText}`}>¿Qué está pasando?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Verificando el pago con tu banco</li>
              <li>Activando tu suscripción</li>
              <li>Configurando tu cuenta premium</li>
            </ul>
          </div>

          {paymentResolved ? (
            <div className="text-center text-green-600 mb-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p className={`font-medium ${modernTheme.colors.textGreen}`}>¡Pago procesado! Redirigiendo...</p>
            </div>
          ) : (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className={`w-full py-3 ${modernTheme.effects.transition}`}
              disabled={isChecking}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? "Verificando..." : "Actualizar Estado"}
            </Button>
          )}

          <Button
            onClick={handleGoHome}
            variant="outline"
            className={`w-full py-3 ${modernTheme.effects.transition}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>

          <div className={`text-center text-sm ${modernTheme.colors.mutedForeground} mt-4`}>
            ¿El pago no se procesa?{" "}
            <a href="mailto:soporte@gtdbuddy.com" className={`${modernTheme.colors.primaryText} hover:underline ${modernTheme.effects.transition}`}>
              Contacta soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
