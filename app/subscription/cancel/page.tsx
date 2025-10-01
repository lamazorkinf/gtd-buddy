"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { modernTheme } from "@/lib/theme"

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

      const data = await response.json()

      if (response.ok) {
        // Redirigir con mensaje de confirmación
        router.push(`/subscription/cancelled?message=${encodeURIComponent(data.message || "")}`)
      } else {
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
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
      <Card className={`w-full max-w-md mx-auto overflow-hidden ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 text-center">
          <AlertTriangle className="h-20 w-20 mx-auto mb-4" />
          <h1 className={`text-3xl ${modernTheme.typography.heading}`}>Cancelar Suscripción</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className={`text-2xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
            ¿Estás seguro?
          </CardTitle>
          <CardDescription className={`${modernTheme.colors.mutedForeground} mt-2`}>
            Tu suscripción continuará activa hasta el final del período pagado. Después de esa fecha, no se te cobrará más.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <div className={`${modernTheme.colors.cardRed} border ${modernTheme.container.radius} p-4`}>
            <h3 className={`font-medium ${modernTheme.colors.textRed} mb-2`}>Lo que perderás:</h3>
            <ul className={`text-sm ${modernTheme.colors.textRed} space-y-1 list-disc list-inside`}>
              <li>Captura ilimitada de tareas</li>
              <li>Organización por contextos y proyectos</li>
              <li>Revisión semanal guiada</li>
              <li>Vista de calendario integrada</li>
              <li>Sincronización en todos tus dispositivos</li>
              <li>Soporte prioritario</li>
            </ul>
          </div>

          {error && (
            <Alert className={`${modernTheme.colors.cardRed} border ${modernTheme.container.radius}`}>
              <AlertTriangle className={`h-4 w-4 ${modernTheme.colors.textRed}`} />
              <AlertDescription className={modernTheme.colors.textRed}>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className={`w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 text-lg ${modernTheme.effects.transition}`}
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
              className={`w-full py-3 ${modernTheme.effects.transition}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mantener Suscripción
            </Button>
          </div>

          <div className={`text-center text-sm ${modernTheme.colors.mutedForeground}`}>
            ¿Necesitas ayuda?{" "}
            <a href="mailto:soporte@gtdbuddy.com" className={`${modernTheme.colors.primaryText} hover:underline ${modernTheme.effects.transition}`}>
              Contacta soporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
