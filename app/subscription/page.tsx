"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ArrowRight, Check, Loader2, AlertCircle, LogOut, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SubscriptionPage() {
  const { user, subscriptionStatus, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [processingSubscription, setProcessingSubscription] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return // Wait for auth to finish loading

    if (!user) {
      router.push("/auth")
      return
    }

    // Usar la nueva lógica de verificación de suscripción
    if (subscriptionStatus.canAccessDashboard) {
      router.replace("/")
      return
    }

    // Si no loading y no redirected, set processing to false to show the page content
    setProcessingSubscription(false)
  }, [user, authLoading, subscriptionStatus, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleSubscribe = async () => {
    setProcessingSubscription(true)
    setError(null)
    setErrorDetails(null)

    try {
      if (!user || !user.uid || !user.email) {
        setError("Debes iniciar sesión para suscribirte.")
        setProcessingSubscription(false)
        return
      }

      const shouldShowTrialOption =
        !subscriptionStatus.isExpired &&
        !user?.subscriptionEndDate &&
        user?.subscriptionStatus !== "trial" &&
        !user?.isInTrialPeriod

      // Si es período de prueba, usar API diferente
      const apiEndpoint = shouldShowTrialOption ? "/api/start-trial" : "/api/create-subscription"
      const requestBody = shouldShowTrialOption 
        ? { userId: user.uid }
        : { userId: user.uid, email: user.email }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const text = await response.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch (_err) {
        setError("Error en el servidor. Por favor intenta más tarde.")
        setProcessingSubscription(false)
        return
      }

      if (!response.ok) {
        setError(data.error || `Error ${response.status}`)
        if (data.details) setErrorDetails(data.details)
        setProcessingSubscription(false)
        return
      }

      if (data.init_point) {
        window.location.href = data.init_point
        return // Redirection will happen, no need to set processingSubscription to false
      }

      if (data.success) {
        // Si es trial, redirigir al dashboard. Si es suscripción, a success
        if (shouldShowTrialOption) {
          router.push("/")
        } else {
          router.push("/subscription/success")
        }
        return // Redirection will happen
      }

      throw new Error("Respuesta inesperada del servidor")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setProcessingSubscription(false)
    }
  }

  // Show main loading spinner if auth is loading or if user data is present but we are still processing subscription state
  if (authLoading || (user && processingSubscription && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gtd-clarity-500 mx-auto mb-4" />
          <p className="text-gtd-clarity-700 text-lg">Verificando estado de suscripción...</p>
          {user && (
            <p className="text-xs text-gtd-neutral-500 mt-2">
              Usuario: {user.email} | Status: {user.subscriptionStatus} | Expirado:{" "}
              {String(subscriptionStatus.isExpired)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Si el usuario no puede acceder al dashboard, mostrar la página de suscripción
  if (!subscriptionStatus.canAccessDashboard) {
    const isExpiredSubscription = subscriptionStatus.isExpired
    const shouldShowTrialOption =
      !isExpiredSubscription &&
      !user?.subscriptionEndDate &&
      user?.subscriptionStatus !== "trial" &&
      !user?.isInTrialPeriod

    const buttonText = shouldShowTrialOption ? "Iniciar período de prueba gratuito" : "Suscribirse ahora"
    const buttonLoadingText = shouldShowTrialOption ? "Iniciando prueba..." : "Procesando..."

    return (
      <div className="min-h-screen flex flex-col selection:bg-gtd-action-300 selection:text-white">
        <header className="w-full py-4 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-sm border-b border-gtd-neutral-100 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gtd-clarity-600 via-gtd-action-500 to-gtd-focus-500 bg-clip-text text-transparent font-heading">
              GTD Buddy
            </h1>
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gtd-neutral-700">Hola, {user.displayName || user.email}</div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gtd-clarity-400 to-gtd-action-400 flex items-center justify-center text-white text-sm font-medium ring-2 ring-white">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="ml-2 text-gtd-neutral-700 hover:text-gtd-neutral-900 border-gtd-neutral-200 hover:bg-gtd-neutral-100"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">
            {/* Alerta de suscripción expirada */}
            {isExpiredSubscription && (
              <Alert className="mb-8 border-red-200 bg-red-50">
                <Clock className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Tu suscripción ha expirado.</strong> Para continuar usando GTD Buddy, necesitas renovar tu
                  suscripción.
                  {user?.subscriptionEndDate && (
                    <span className="block text-sm mt-1">
                      Expiró el:{" "}
                      {new Date(
                        (user.subscriptionEndDate as any)?.seconds
                          ? (user.subscriptionEndDate as any).seconds * 1000
                          : user.subscriptionEndDate,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 font-heading text-gtd-clarity-700">
                {isExpiredSubscription
                  ? "Renueva tu Suscripción"
                  : shouldShowTrialOption
                    ? "¡Bienvenido a GTD Buddy!"
                    : "Potencia tu Productividad"}
              </h2>
              <p className="text-lg text-gtd-neutral-600 max-w-2xl mx-auto">
                {isExpiredSubscription
                  ? "Tu período de acceso ha terminado. Renueva tu suscripción para continuar organizando tu vida con GTD."
                  : shouldShowTrialOption
                    ? "Comienza tu período de prueba gratuito de 7 días y descubre cómo GTD puede transformar tu organización."
                    : "Suscríbete para desbloquear todas las funcionalidades y organizar tu vida con el método GTD."}
              </p>
            </div>

            <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-gtd-clarity-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
              <div className="p-8 text-center">
                {shouldShowTrialOption ? (
                  <>
                    <span className="text-4xl font-bold text-gtd-confidence-600">Gratis</span>
                    <span className="text-gtd-neutral-500 ml-1">por 7 días</span>
                    <div className="text-sm text-gtd-neutral-500 mt-1">Luego $2.500 ARS/mes</div>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-gtd-clarity-700">$2.500</span>
                    <span className="text-gtd-neutral-500 ml-1">ARS/mes</span>
                  </>
                )}
              </div>
              <CardContent className="px-8">
                <ul className="space-y-3 text-gtd-neutral-700">
                  {[
                    "Captura ilimitada de tareas",
                    "Organización por contextos y proyectos",
                    "Revisión semanal guiada",
                    "Vista de calendario integrada",
                    "Procesamiento eficiente de bandeja de entrada",
                    "Sincronización en todos tus dispositivos",
                    "Soporte prioritario",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-gtd-confidence-500 mr-2 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 mt-4">
                <Button
                  className="w-full bg-gradient-to-r from-gtd-clarity-500 via-gtd-action-500 to-gtd-focus-500 hover:from-gtd-clarity-600 hover:via-gtd-action-600 hover:to-gtd-focus-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-lg"
                  onClick={handleSubscribe}
                  disabled={processingSubscription}
                >
                  {processingSubscription ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {buttonLoadingText}
                    </>
                  ) : (
                    <>
                      {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-red-700 font-medium">Error al procesar suscripción</div>
                    <div className="text-red-600 text-sm mt-1">{error}</div>
                    {errorDetails && (
                      <div className="text-red-500 text-xs mt-2 bg-red-100 p-2 rounded">
                        <strong>Detalles técnicos:</strong> {errorDetails}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gtd-neutral-500">
              {shouldShowTrialOption ? (
                <>
                  Al iniciar tu prueba, aceptas nuestros{" "}
                  <a href="#" className="text-gtd-clarity-600 hover:underline">
                    Términos
                  </a>{" "}
                  y{" "}
                  <a href="#" className="text-gtd-clarity-600 hover:underline">
                    Privacidad
                  </a>
                  . Cancela en cualquier momento.
                </>
              ) : (
                <>
                  Al suscribirte, aceptas nuestros{" "}
                  <a href="#" className="text-gtd-clarity-600 hover:underline">
                    Términos
                  </a>{" "}
                  y{" "}
                  <a href="#" className="text-gtd-clarity-600 hover:underline">
                    Privacidad
                  </a>
                  .
                </>
              )}
            </div>
          </div>
        </main>

        <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-sm border-t border-gtd-neutral-100">
          <div className="max-w-7xl mx-auto text-center text-sm text-gtd-neutral-600">
            <p>© {new Date().getFullYear()} GTD Buddy. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    )
  }

  // Fallback loading, should ideally be covered by the first loading check
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-gtd-clarity-500" />
    </div>
  )
}
