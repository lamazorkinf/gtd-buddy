"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SubscriptionCancelPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancelSubscription = async () => {
    if (!user?.uid) return

    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      })

      if (response.ok) {
        // Redirigir a una página de confirmación de cancelación
        router.push("/subscription/cancelled")
      } else {
        const data = await response.json()
        setError(data.error || "Error al cancelar la suscripción")
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setIsCancelling(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-xl rounded-xl bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
        <div className="bg-red-500 text-white p-8 text-center">
          <AlertTriangle className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-heading">Cancelar Suscripción</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className="text-2xl font-bold text-gtd-neutral-800 font-heading">
            ¿Estás seguro?
          </CardTitle>
          <CardDescription className="text-gtd-neutral-600 mt-2">
            Esta acción cancelará tu suscripción activa. Perderás acceso a todas las funcionalidades premium.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Lo que perderás:</h3>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Captura ilimitada de tareas</li>
              <li>Organización por contextos y proyectos</li>
              <li>Revisión semanal guiada</li>
              <li>Vista de calendario integrada</li>
              <li>Sincronización en todos tus dispositivos</li>
              <li>Soporte prioritario</li>
            </ul>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 text-lg"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sí, Cancelar Suscripción"
              )}
            </Button>

            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full border-gtd-neutral-300 text-gtd-neutral-700 hover:bg-gtd-neutral-100 py-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mantener Suscripción
            </Button>
          </div>

          <div className="text-center text-sm text-gtd-neutral-500">
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