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
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-xl rounded-xl bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
        <div className="bg-red-500 text-white p-8 text-center">
          <XCircle className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-heading">Pago No Procesado</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className="text-2xl font-bold text-gtd-neutral-800 font-heading">Hubo un Problema</CardTitle>
          <CardDescription className="text-gtd-neutral-600 mt-2">
            No se pudo procesar tu suscripción. Esto puede deberse a:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <ul className="text-sm text-gtd-neutral-600 space-y-2 list-disc list-inside bg-gtd-neutral-50 p-4 rounded-lg border border-gtd-neutral-200">
            <li>Fondos insuficientes en tu tarjeta</li>
            <li>Datos de tarjeta incorrectos</li>
            <li>Problemas temporales del banco</li>
            <li>Cancelación del proceso de pago</li>
          </ul>

          <Button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-gtd-clarity-500 to-gtd-action-500 hover:from-gtd-clarity-600 hover:to-gtd-action-600 text-white font-medium py-3 text-lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Intentar Nuevamente
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
            ¿Necesitas ayuda?{" "}
            <a href="mailto:soporte@gtdbuddy.com" className="text-gtd-clarity-600 hover:underline">
              Contacta soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
