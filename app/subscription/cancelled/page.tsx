"use client"

import { useRouter } from "next/navigation"
import { CheckCircle, ArrowRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubscriptionCancelledPage() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push("/")
  }

  const handleResubscribe = () => {
    router.push("/subscription")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-xl rounded-xl bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
        <div className="bg-gtd-neutral-600 text-white p-8 text-center">
          <CheckCircle className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold font-heading">Suscripción Cancelada</h1>
        </div>

        <CardHeader className="text-center pb-2 pt-6">
          <CardTitle className="text-2xl font-bold text-gtd-neutral-800 font-heading">
            Te extrañaremos
          </CardTitle>
          <CardDescription className="text-gtd-neutral-600 mt-2">
            Tu suscripción ha sido cancelada exitosamente. Seguirás teniendo acceso hasta el final de tu período actual.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          <div className="bg-gtd-lightness-50 border border-gtd-lightness-200 rounded-lg p-4 text-center">
            <Heart className="h-8 w-8 text-gtd-confidence-500 mx-auto mb-3" />
            <h3 className="font-medium text-gtd-neutral-800 mb-2">Gracias por usar GTD Buddy</h3>
            <p className="text-sm text-gtd-neutral-600">
              Esperamos que nuestro tiempo juntos haya sido productivo. ¡Las puertas siempre están abiertas para tu regreso!
            </p>
          </div>

          <div className="bg-gtd-neutral-50 border border-gtd-neutral-200 rounded-lg p-4">
            <h3 className="font-medium text-gtd-neutral-800 mb-2">¿Cambios de opinión?</h3>
            <p className="text-sm text-gtd-neutral-600 mb-3">
              Puedes reactivar tu suscripción en cualquier momento y continuar donde lo dejaste.
            </p>
            <Button
              onClick={handleResubscribe}
              variant="outline"
              size="sm"
              className="w-full border-gtd-clarity-300 text-gtd-clarity-700 hover:bg-gtd-clarity-100"
            >
              Reactivar Suscripción
            </Button>
          </div>

          <Button
            onClick={handleGoHome}
            className="w-full bg-gradient-to-r from-gtd-clarity-500 via-gtd-action-500 to-gtd-focus-500 hover:from-gtd-clarity-600 hover:via-gtd-action-600 hover:to-gtd-focus-600 text-white font-medium py-3 text-lg"
          >
            Ir al Inicio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="text-center text-sm text-gtd-neutral-500">
            ¿Feedback sobre tu experiencia?{" "}
            <a href="mailto:feedback@gtdbuddy.com" className="text-gtd-clarity-600 hover:underline">
              Compártelo con nosotros
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
