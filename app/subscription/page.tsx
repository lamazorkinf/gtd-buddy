"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ArrowRight, Check, Loader2, AlertCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function SubscriptionPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  // Verificar si el usuario nunca tuvo suscripción (debe ver "Iniciar período de prueba")
  const shouldShowTrialOption = (user: any) => {
    if (!user) return false
    // Si nunca tuvo suscripción (no tiene subscriptionEndDate y no está en trial actualmente)
    return !user.subscriptionEndDate && user.subscriptionStatus !== "trial" && !user.isInTrialPeriod
  }

  // Manejar redirección según el estado de suscripción
  useEffect(() => {
    console.log("🔍 useEffect ejecutándose...")
    console.log("🔍 Estado completo del usuario:", user)

    // Si user es undefined, seguimos esperando
    if (user === undefined) {
      console.log("⏳ Usuario aún cargando...")
      return
    }

    // Si user es null, no hay sesión
    if (user === null) {
      console.log("❌ No hay usuario, redirigiendo a auth")
      router.push("/auth")
      return
    }

    // Usuario existe, verificar su estado
    console.log("👤 Usuario encontrado:", {
      uid: user.uid,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      isInTrialPeriod: user.isInTrialPeriod,
      subscriptionEndDate: user.subscriptionEndDate,
    })

    // Verificar si debe ser redirigido al dashboard
    const shouldRedirectToDashboard =
      user.subscriptionStatus === "active" || user.subscriptionStatus === "trial" || user.isInTrialPeriod === true

    if (shouldRedirectToDashboard) {
      console.log("✅ Usuario debe ser redirigido al dashboard")
      console.log("🔄 Ejecutando router.push('/')")

      // Usar replace en lugar de push para evitar problemas de navegación
      router.replace("/")
      return
    }

    // Si llegamos aquí, el usuario necesita suscripción
    console.log("⏳ Usuario necesita suscripción, mostrando página")
    setLoading(false)
  }, [user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleSubscribe = async () => {
    console.log("🚀 Iniciando proceso de suscripción...")
    setLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      if (!user || !user.uid || !user.email) {
        console.log("❌ Usuario no autenticado o sin datos")
        setError("Debes iniciar sesión para suscribirte.")
        setLoading(false)
        return
      }

      console.log("👤 Usuario autenticado:", user.email)

      const requestData = {
        userId: user.uid,
        email: user.email,
      }
      console.log("📤 Enviando datos al servidor:", requestData)

      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("📥 Respuesta recibida - Status:", response.status)

      const text = await response.text()

      let data: any
      try {
        data = JSON.parse(text)
      } catch (_err) {
        console.error("❌ No se recibió JSON legible del servidor:", text)
        setError("Error en el servidor. Por favor intenta más tarde.")
        setLoading(false)
        return
      }

      if (!response.ok) {
        console.log("❌ Error en respuesta:", data)
        setError(data.error || `Error ${response.status}`)
        if (data.details) {
          setErrorDetails(data.details)
        }
        setLoading(false)
        return
      }

      console.log("✅ Datos de respuesta:", data)

      if (data.init_point) {
        console.log("🔗 Redirigiendo al checkout de Mercado Pago:", data.init_point)
        window.location.href = data.init_point
        return
      }

      if (data.success) {
        console.log("✅ Suscripción creada exitosamente (sin init_point)")
        router.push("/subscription/success")
        return
      }

      throw new Error("Respuesta inesperada del servidor")
    } catch (err) {
      console.error("❌ Error en handleSubscribe:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Mostrar spinner mientras se valida la sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-gray-600">Verificando estado de suscripción...</p>
          {user && (
            <p className="text-xs text-gray-400 mt-2">
              Usuario: {user.email} | Status: {user.subscriptionStatus} | Trial: {user.isInTrialPeriod?.toString()}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Determinar el texto del botón según si debe mostrar opción de prueba
  const showTrialOption = shouldShowTrialOption(user)
  const buttonText = showTrialOption ? "Iniciar período de prueba" : "Suscribirse ahora"
  const buttonLoadingText = showTrialOption ? "Iniciando prueba..." : "Procesando..."

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            GTD Buddy
          </h1>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Hola, {user.displayName || user.email}</div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-heading">
              {showTrialOption ? "¡Bienvenido a GTD Buddy!" : "Potencia tu productividad con GTD Buddy"}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {showTrialOption
                ? "Comienza tu período de prueba gratuito de 7 días y descubre cómo GTD puede transformar tu productividad."
                : "Suscríbete para desbloquear todas las funcionalidades y organizar tu vida con el método GTD."}
            </p>
          </div>

          <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6 text-center">
              {showTrialOption ? (
                <div className="pt-4">
                  <span className="text-4xl font-bold text-green-600">Gratis</span>
                  <span className="text-gray-500 ml-1">por 7 días</span>
                  <div className="text-sm text-gray-500 mt-1">Luego $2.500/mes</div>
                </div>
              ) : (
                <>
                  <span className="text-4xl font-bold">$2.500</span>
                  <span className="text-gray-500 ml-1">/mes</span>
                  <div className="text-sm text-gray-500 mt-1">Pesos argentinos</div>
                </>
              )}
            </div>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Captura ilimitada de tareas",
                  "Organización por contextos",
                  "Revisión semanal guiada",
                  "Vista de calendario",
                  "Procesamiento de bandeja de entrada",
                  "Sincronización en todos tus dispositivos",
                  "Soporte prioritario",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {buttonLoadingText}
                  </>
                ) : (
                  <>
                    {buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
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

          <div className="mt-8 text-center text-sm text-gray-500">
            {showTrialOption ? (
              <>
                Al iniciar tu prueba gratuita, aceptas nuestros{" "}
                <a href="#" className="text-purple-600 hover:underline">
                  Términos de servicio
                </a>{" "}
                y{" "}
                <a href="#" className="text-purple-600 hover:underline">
                  Política de privacidad
                </a>
                . Cancela en cualquier momento durante el período de prueba.
              </>
            ) : (
              <>
                Al suscribirte, aceptas nuestros{" "}
                <a href="#" className="text-purple-600 hover:underline">
                  Términos de servicio
                </a>{" "}
                y{" "}
                <a href="#" className="text-purple-600 hover:underline">
                  Política de privacidad
                </a>
                .
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-sm border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} GTD Buddy. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
