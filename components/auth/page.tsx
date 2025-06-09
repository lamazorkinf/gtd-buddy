"use client"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"

export default function AuthPage() {
  const [formLoading, setFormLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleEmailAuth = async (isSignup: boolean) => {
    setFormLoading(true)
    try {
      await signIn("credentials", {
        email: email,
        password: password,
        callbackUrl: callbackUrl,
        redirect: false,
      })
    } catch (error: any) {
      console.log("Error signing in with credentials", error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setFormLoading(true)
    try {
      await signIn("google", { callbackUrl: callbackUrl, redirect: false })
    } catch (error: any) {
      console.log("Error signing in with Google", error)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gtd-gradient-bg p-4 selection:bg-gtd-action-300 selection:text-white relative overflow-hidden">
      <Card className="w-full max-w-md z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gtd-clarity-600 to-gtd-action-600 bg-clip-text text-transparent font-heading">
            GTD Buddy
          </CardTitle>
          <CardDescription>Administra tus tareas con GTD.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList>
              <TabsTrigger
                value="signin"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gtd-clarity-500 data-[state=active]:to-gtd-action-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md py-2 gtd-transition"
              >
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gtd-confidence-500 data-[state=active]:to-gtd-focus-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md py-2 gtd-transition"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="ejemplo@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button
                onClick={() => handleEmailAuth(false)}
                disabled={formLoading}
                className="w-full gtd-gradient-action hover:from-gtd-action-600 hover:to-gtd-action-800 text-white py-3 text-md rounded-lg font-semibold gtd-transition"
              >
                {formLoading ? "Iniciando..." : "Iniciar Sesión"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continua con</span>
                </div>
              </div>
              <Button
                variant={"outline"}
                disabled={formLoading}
                onClick={handleGoogleAuth}
                className="w-full gap-2 gtd-transition"
              >
                {formLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                Google
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="ejemplo@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button
                onClick={() => handleEmailAuth(true)}
                disabled={formLoading}
                className="w-full gtd-gradient-confidence hover:from-gtd-confidence-600 hover:to-gtd-confidence-800 text-white py-3 text-md rounded-lg font-semibold gtd-transition"
              >
                {formLoading ? "Registrando..." : "Registrarse"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continua con</span>
                </div>
              </div>
              <Button
                variant={"outline"}
                disabled={formLoading}
                onClick={handleGoogleAuth}
                className="w-full gap-2 gtd-transition"
              >
                {formLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
