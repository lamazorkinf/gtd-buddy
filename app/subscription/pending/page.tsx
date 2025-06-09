"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubscriptionPendingPage() {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutos en segundos

  useEffect(() => {
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

    // Auto-refresh cada 30 segundos para verificar el estado (simulado)
    const refreshTimer = setInterval(() => {
      console.log("🔄 Verificando estado del pago...")
      // Aquí harías una llamada a tu API para verificar el estado real
      // Si el estado cambia, redirigir a /subscription/success o /subscription/failure
    }, 30000)

    return () => {
      clearInterval(timer)
      clearInterval(refreshTimer)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleRefresh = () => {
    // Idealmente, esto debería llamar a una API para verificar el estado
    // y luego redirigir o actualizar la UI según la respuesta.
    // Por ahora, solo recarga la página.
    window.location.reload()
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-xl rounded-xl bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
        <div className="bg-yellow-500 text-white p-8 text-center">
          <Clock className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-heading">Pago Pendiente</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className="text-2xl font-bold text-gtd-neutral-800 font-heading">Verificando tu Pago</CardTitle>
          <CardDescription className="text-gtd-neutral-600 mt-2">
            Tu pago está siendo procesado. Esto puede tomar unos minutos. Te notificaremos cuando esté listo.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800 mb-2">Tiempo estimado de verificación:</p>
            <p className="text-3xl font-bold text-yellow-900">{formatTime(timeLeft)}</p>
          </div>

          <div className="text-sm text-gtd-neutral-600 space-y-2 bg-gtd-neutral-50 p-4 rounded-lg border border-gtd-neutral-200">
            <p className="font-medium text-gtd-neutral-700">¿Qué está pasando?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Verificando el pago con tu banco</li>
              <li>Activando tu suscripción</li>
              <li>Configurando tu cuenta premium</li>
            </ul>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-100 py-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar Estado
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full border-gtd-neutral-300 text-gtd-neutral-700 hover:bg-gtd-neutral-100 py-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>

          <div className="text-center text-sm text-gtd-neutral-500 mt-4">
            ¿El pago no se procesa?{" "}
            <a href="mailto:soporte@gtdbuddy.com" className="text-gtd-clarity-600 hover:underline">
              Contacta soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
