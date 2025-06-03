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
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Auto-refresh cada 30 segundos para verificar el estado
    const refreshTimer = setInterval(() => {
      console.log("🔄 Verificando estado del pago...")
      // Aquí podrías hacer una llamada a tu API para verificar el estado
    }, 30000)

    return () => {
      clearInterval(timer)
      clearInterval(refreshTimer)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
        {/* Header amarillo con ícono de reloj */}
        <div className="bg-yellow-500 text-white p-6 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Pago Pendiente</h1>
        </div>

        {/* Contenido principal */}
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900">Estamos verificando tu pago</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Tu pago está siendo procesado. Esto puede tomar unos minutos. Te notificaremos cuando esté listo.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800 mb-2">Tiempo estimado de verificación:</p>
            <p className="text-2xl font-bold text-yellow-900">{formatTime(timeLeft)}</p>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>¿Qué está pasando?</strong>
            </p>
            <ul className="space-y-1 ml-4">
              <li>• Verificando el pago con tu banco</li>
              <li>• Activando tu suscripción</li>
              <li>• Configurando tu cuenta premium</li>
            </ul>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50 py-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar Estado
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            ¿El pago no se procesa?{" "}
            <a href="mailto:soporte@gtdbuddy.com" className="text-purple-600 hover:underline">
              Contacta soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
