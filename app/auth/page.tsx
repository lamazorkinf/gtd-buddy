"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Mail, Lock, Chrome, Edit3, Eye, EyeOff, Loader2 } from "lucide-react"

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

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
        await signUp(email, password, firstName, lastName)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gtd-clarity-500 mx-auto mb-4" />
          <p className="text-gtd-clarity-700 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full shadow-2xl rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
          <CardHeader className="text-center pt-8 pb-4 bg-gtd-lightness-50/30">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gtd-clarity-600 to-gtd-action-500 bg-clip-text text-transparent font-heading">
              GTD Buddy
            </CardTitle>
            <CardDescription className="text-gtd-neutral-700 mt-1">
              {activeTab === "signup"
                ? "Crea tu cuenta para organizar tu vida."
                : "Inicia sesión para acceder a tus tareas."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{error}</div>
            )}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gtd-neutral-100 p-1 rounded-lg">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gtd-clarity-500 data-[state=active]:to-gtd-action-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md py-2 transition-all duration-300 text-gtd-neutral-700"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gtd-confidence-500 data-[state=active]:to-gtd-focus-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md py-2 transition-all duration-300 text-gtd-neutral-700"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 py-3 text-md rounded-lg focus:border-gtd-clarity-500 focus:ring-gtd-clarity-500 border-gtd-neutral-200 bg-white"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 py-3 text-md rounded-lg focus:border-gtd-clarity-500 focus:ring-gtd-clarity-500 border-gtd-neutral-200 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gtd-neutral-400 hover:text-gtd-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div>
                    <Button
                      onClick={() => handleEmailAuth(false)}
                      disabled={formLoading}
                      className="w-full bg-gradient-to-r from-gtd-clarity-500 to-gtd-action-500 hover:from-gtd-clarity-600 hover:to-gtd-action-600 text-white py-3 text-md rounded-lg font-semibold"
                    >
                      {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {formLoading ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => handleTabChange("signup")}
                      className="text-sm text-gtd-clarity-600 hover:text-gtd-clarity-800 hover:underline"
                    >
                      ¿No tienes cuenta? Crea una aquí
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Edit3 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                      <Input
                        type="text"
                        placeholder="Nombre"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-12 py-3 text-md rounded-lg focus:border-gtd-confidence-500 focus:ring-gtd-confidence-500 border-gtd-neutral-200 bg-white"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Edit3 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                      <Input
                        type="text"
                        placeholder="Apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-12 py-3 text-md rounded-lg focus:border-gtd-confidence-500 focus:ring-gtd-confidence-500 border-gtd-neutral-200 bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 py-3 text-md rounded-lg focus:border-gtd-confidence-500 focus:ring-gtd-confidence-500 border-gtd-neutral-200 bg-white"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña (mín. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 py-3 text-md rounded-lg focus:border-gtd-confidence-500 focus:ring-gtd-confidence-500 border-gtd-neutral-200 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gtd-neutral-400 hover:text-gtd-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gtd-neutral-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar Contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-12 py-3 text-md rounded-lg focus:border-gtd-confidence-500 focus:ring-gtd-confidence-500 border-gtd-neutral-200 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gtd-neutral-400 hover:text-gtd-neutral-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div>
                    <Button
                      onClick={() => handleEmailAuth(true)}
                      disabled={formLoading}
                      className="w-full bg-gradient-to-r from-gtd-confidence-500 to-gtd-focus-500 hover:from-gtd-confidence-600 hover:to-gtd-focus-600 text-white py-3 text-md rounded-lg font-semibold"
                    >
                      {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {formLoading ? "Registrando..." : "Crear Cuenta"}
                    </Button>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => handleTabChange("signin")}
                      className="text-sm text-gtd-clarity-600 hover:text-gtd-clarity-800 hover:underline"
                    >
                      ¿Ya tienes cuenta? Inicia sesión aquí
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gtd-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 px-2 text-gtd-neutral-600">O continúa con</span>
                </div>
              </div>
              <Button
                onClick={handleGoogleAuth}
                disabled={formLoading}
                variant="outline"
                className="w-full mt-6 py-3 text-md rounded-lg border-gtd-neutral-300 hover:bg-gtd-neutral-100 text-gtd-neutral-800 bg-white"
              >
                {formLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-5 w-5 text-red-500" />
                )}
                Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
