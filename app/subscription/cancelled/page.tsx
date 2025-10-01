"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, ArrowRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { modernTheme } from "@/lib/theme"

export default function SubscriptionCancelledPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")

  const handleGoHome = () => {
    router.push("/")
  }

  const handleResubscribe = () => {
    router.push("/subscription")
  }

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${modernTheme.colors.bg}`}>
      <Card className={`w-full max-w-md mx-auto overflow-hidden ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.container.shadow}`}>
        <div className={`${modernTheme.colors.secondary} text-white p-8 text-center`}>
          <CheckCircle className="h-20 w-20 mx-auto mb-4" />
          <h1 className={`text-3xl ${modernTheme.typography.heading}`}>Suscripción Cancelada</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className={`text-2xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
            Te extrañaremos
          </CardTitle>
          <CardDescription className={`${modernTheme.colors.mutedForeground} mt-2`}>
            Tu suscripción ha sido cancelada exitosamente. Seguirás teniendo acceso hasta el final de tu período actual.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {message && (
            <Alert className={`${modernTheme.colors.cardGreen} border ${modernTheme.container.radius}`}>
              <CheckCircle className={`h-4 w-4 ${modernTheme.colors.textGreen}`} />
              <AlertDescription className={modernTheme.colors.textGreen}>{message}</AlertDescription>
            </Alert>
          )}

          <div className={`${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} p-4 text-center`}>
            <Heart className={`h-8 w-8 mx-auto mb-3 ${modernTheme.colors.primaryText}`} />
            <h3 className={`font-medium ${modernTheme.colors.primaryText} mb-2`}>Gracias por usar GTD Buddy</h3>
            <p className={`text-sm ${modernTheme.colors.mutedForeground}`}>
              Esperamos que nuestro tiempo juntos haya sido productivo. ¡Las puertas siempre están abiertas para tu regreso!
            </p>
          </div>

          <div className={`${modernTheme.colors.cardPurple} border ${modernTheme.container.radius} p-4`}>
            <h3 className={`font-medium ${modernTheme.colors.primaryText} mb-2`}>¿Cambios de opinión?</h3>
            <p className={`text-sm ${modernTheme.colors.mutedForeground} mb-3`}>
              Puedes reactivar tu suscripción en cualquier momento y continuar donde lo dejaste.
            </p>
            <Button
              onClick={handleResubscribe}
              variant="outline"
              size="sm"
              className={`w-full ${modernTheme.effects.transition}`}
            >
              Reactivar Suscripción
            </Button>
          </div>

          <Button
            onClick={handleGoHome}
            className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} font-medium py-3 text-lg ${modernTheme.effects.transition}`}
          >
            Ir al Inicio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className={`text-center text-sm ${modernTheme.colors.mutedForeground}`}>
            ¿Feedback sobre tu experiencia?{" "}
            <a href="mailto:feedback@gtdbuddy.com" className={`${modernTheme.colors.primaryText} hover:underline ${modernTheme.effects.transition}`}>
              Compártelo con nosotros
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
