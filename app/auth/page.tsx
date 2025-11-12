"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Mail, Lock, Edit3, Eye, EyeOff, Loader2, Phone } from "lucide-react"
import { modernTheme } from "@/lib/theme"
import Image from "next/image"

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formLoading, setFormLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("signup")
  const [error, setError] = useState<string | null>(null)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError(null)
    // Reset form fields when changing tabs for better UX
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setFirstName("")
    setLastName("")
    setPhoneNumber("")
    const url = new URL(window.location.href)
    url.searchParams.set("tab", value)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "signin" || tab === "signup") {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  const handleEmailAuth = async (isSignUp: boolean) => {
    setFormLoading(true)
    setError(null)
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden.")
          setFormLoading(false)
          return
        }
        if (!firstName.trim() || !lastName.trim()) {
          setError("Nombre y Apellido son requeridos.")
          setFormLoading(false)
          return
        }
        await signUp(email, password, firstName, lastName, phoneNumber)
      } else {
        await signIn(email, password)
      }
    } catch (err: any) {
      console.error("Error de autenticación:", err)
      let friendlyMessage = "Ocurrió un error. Inténtalo de nuevo."
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "Este correo electrónico ya está registrado. Intenta iniciar sesión."
      } else if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        friendlyMessage = "Correo electrónico o contraseña incorrectos."
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres."
      }
      setError(friendlyMessage)
    } finally {
      setFormLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setFormLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error("Error con Google:", err)
      setError(err.message || "Ocurrió un error con Google. Inténtalo de nuevo.")
    } finally {
      setFormLoading(false)
    }
  }

  if (authLoading || (!authLoading && user)) {
    return (
      <div className={`min-h-screen w-full ${modernTheme.colors.bg} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`h-12 w-12 animate-spin ${modernTheme.colors.primaryText} mx-auto mb-4`} />
          <p className={`${modernTheme.colors.primaryText} text-lg`}>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full ${modernTheme.colors.bg} flex items-center justify-center p-4`}>
      <div className="relative z-10 w-full max-w-md">
        <Card className={`w-full ${modernTheme.container.shadow} ${modernTheme.container.radius} overflow-hidden ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder}`}>
          <CardHeader className={`text-center pt-8 pb-4 ${modernTheme.effects.glass}`}>
            <CardTitle className={`text-4xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
              GTD Buddy
            </CardTitle>
            <CardDescription className={`${modernTheme.colors.mutedForeground} mt-1`}>
              {activeTab === "signup"
                ? "Comienza tu período de prueba de 7 días"
                : "Inicia sesión para acceder a tus tareas."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{error}</div>
            )}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className={`grid w-full grid-cols-2 ${modernTheme.effects.glass} p-1 ${modernTheme.container.radius}`}>
                <TabsTrigger
                  value="signin"
                  className={`data-[state=active]:${modernTheme.colors.primary} data-[state=active]:shadow-md ${modernTheme.container.radius} py-2 ${modernTheme.effects.transition} ${modernTheme.colors.mutedForeground}`}
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className={`data-[state=active]:${modernTheme.colors.primary} data-[state=active]:shadow-md ${modernTheme.container.radius} py-2 ${modernTheme.effects.transition} ${modernTheme.colors.mutedForeground}`}
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6 pt-6">
                <Button
                  onClick={handleGoogleAuth}
                  disabled={formLoading}
                  variant="outline"
                  className={`w-full py-3 text-md ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder} ${modernTheme.effects.glassHover} ${modernTheme.effects.transition}`}
                >
                  {formLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Image src="/google-logo.png" alt="Google" width={18} height={18} className="mr-2" />
                  )}
                  Continuar con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className={`w-full border-t ${modernTheme.colors.cardBorder}`} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className={`${modernTheme.effects.glass} px-2 ${modernTheme.colors.mutedForeground}`}>O continúa con email</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-12 pr-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${modernTheme.colors.muted} hover:${modernTheme.colors.primaryText} ${modernTheme.effects.transition}`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div>
                    <Button
                      onClick={() => handleEmailAuth(false)}
                      disabled={formLoading}
                      className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} py-3 text-md ${modernTheme.container.radius} ${modernTheme.typography.heading} ${modernTheme.effects.transition}`}
                    >
                      {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {formLoading ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => handleTabChange("signup")}
                      className={`text-sm ${modernTheme.colors.primaryText} hover:underline ${modernTheme.effects.transition}`}
                    >
                      ¿No tienes cuenta? Crea una aquí
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 pt-6">
                <Button
                  onClick={handleGoogleAuth}
                  disabled={formLoading}
                  variant="outline"
                  className={`w-full py-3 text-md ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder} ${modernTheme.effects.glassHover} ${modernTheme.effects.transition}`}
                >
                  {formLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Image src="/google-logo.png" alt="Google" width={18} height={18} className="mr-2" />
                  )}
                  Continuar con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className={`w-full border-t ${modernTheme.colors.cardBorder}`} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className={`${modernTheme.effects.glass} px-2 ${modernTheme.colors.mutedForeground}`}>O regístrate con email</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Edit3 className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                      <Input
                        type="text"
                        placeholder="Nombre"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`pl-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Edit3 className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                      <Input
                        type="text"
                        placeholder="Apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`pl-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                        required
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                    <Input
                      type="tel"
                      placeholder="WhatsApp (opcional, ej: +54 9 11 1234-5678)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`pl-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                    />
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña (mín. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-12 pr-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${modernTheme.colors.muted} hover:${modernTheme.colors.primaryText} ${modernTheme.effects.transition}`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${modernTheme.colors.muted}`} />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar Contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-12 pr-12 py-3 text-md ${modernTheme.container.radius} ${modernTheme.effects.glass}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${modernTheme.colors.muted} hover:${modernTheme.colors.primaryText} ${modernTheme.effects.transition}`}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div>
                    <Button
                      onClick={() => handleEmailAuth(true)}
                      disabled={formLoading}
                      className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} py-3 text-md ${modernTheme.container.radius} ${modernTheme.typography.heading} ${modernTheme.effects.transition}`}
                    >
                      {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {formLoading ? "Registrando..." : "Comenzar Prueba Gratuita"}
                    </Button>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => handleTabChange("signin")}
                      className={`text-sm ${modernTheme.colors.primaryText} hover:underline ${modernTheme.effects.transition}`}
                    >
                      ¿Ya tienes cuenta? Inicia sesión aquí
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
