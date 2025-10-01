"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { modernTheme } from "@/lib/theme"
import { useToast } from "@/hooks/use-toast"

export default function SubscriptionFailurePage() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Mostrar toast de error al cargar la página
    toast({
      title: "❌ Pago No Procesado",
      description: "No pudimos procesar tu pago. Puedes intentar nuevamente.",
      variant: "destructive",
      duration: 5000,
    })
  }, [toast])

  const handleRetry = () => {
    router.push("/subscription")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
      <Card className={`w-full max-w-md mx-auto overflow-hidden ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 text-center">
          <XCircle className="h-20 w-20 mx-auto mb-4" />
          <h1 className={`text-3xl ${modernTheme.typography.heading}`}>Pago No Procesado</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className={`text-2xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>Hubo un Problema</CardTitle>
          <CardDescription className={`${modernTheme.colors.mutedForeground} mt-2`}>
            No se pudo procesar tu suscripción. Esto puede deberse a:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <ul className={`text-sm ${modernTheme.colors.mutedForeground} space-y-2 list-disc list-inside ${modernTheme.colors.cardRed} p-4 ${modernTheme.container.radius} border`}>
            <li>Fondos insuficientes en tu tarjeta</li>
            <li>Datos de tarjeta incorrectos</li>
            <li>Problemas temporales del banco</li>
            <li>Cancelación del proceso de pago</li>
          </ul>

          <Button
            onClick={handleRetry}
            className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} font-medium py-3 text-lg ${modernTheme.effects.transition}`}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Intentar Nuevamente
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className={`w-full py-3 ${modernTheme.effects.transition}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>

          <div className={`text-center text-sm ${modernTheme.colors.mutedForeground} mt-4`}>
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
