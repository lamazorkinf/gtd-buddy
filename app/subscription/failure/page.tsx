"use client"

import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubscriptionFailurePage() {
  const router = useRouter()

  const handleRetry = () => {
    router.push("/subscription")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
        {/* Header rojo con ícono de error */}
        <div className="bg-red-500 text-white p-6 text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Pago No Procesado</h1>
        </div>

        {/* Contenido principal */}
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900">Hubo un problema con tu pago</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            No se pudo procesar tu suscripción. Esto puede deberse a:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>• Fondos insuficientes en tu tarjeta</li>
            <li>• Datos de tarjeta incorrectos</li>
            <li>• Problemas temporales del banco</li>
            <li>• Cancelación del proceso de pago</li>
          </ul>

          <Button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-medium py-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar Nuevamente
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
            ¿Necesitas ayuda?{" "}
            <a href="mailto:soporte@gtdbuddy.com" className="text-purple-600 hover:underline">
              Contacta soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
