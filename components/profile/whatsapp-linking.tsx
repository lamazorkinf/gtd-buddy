"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageCircle, Check, X, Loader2, Copy, CheckCircle2, Smartphone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { modernTheme } from "@/lib/theme"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { WhatsAppLink } from "@/types/whatsapp"
import { normalizeWhatsAppNumber } from "@/lib/whatsapp-utils"

export default function WhatsAppLinking() {
  const { user } = useAuth()
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [linkCode, setLinkCode] = useState<string | null>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [linkedNumber, setLinkedNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Verificar si ya hay una cuenta vinculada
  useEffect(() => {
    checkExistingLink()
  }, [user])

  const checkExistingLink = async () => {
    if (!user) return

    try {
      setCheckingLink(true)
      const linksRef = collection(db, "whatsappLinks")
      const q = query(linksRef, where("userId", "==", user.uid), where("isActive", "==", true))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const linkData = snapshot.docs[0].data() as WhatsAppLink
        setIsLinked(true)
        setLinkedNumber(linkData.whatsappNumber)
      }
    } catch (err) {
      console.error("Error verificando link:", err)
    } finally {
      setCheckingLink(false)
    }
  }

  const handleGenerateCode = async () => {
    if (!user || !whatsappNumber.trim()) {
      setError("Por favor, ingresa un número de WhatsApp")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const normalized = normalizeWhatsAppNumber(whatsappNumber)

      if (normalized.length < 10) {
        setError("Número de WhatsApp inválido")
        return
      }

      // Generar código de vinculación
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const expiryDate = new Date()
      expiryDate.setMinutes(expiryDate.getMinutes() + 15)

      // Guardar en Firestore
      const { addDoc } = await import("firebase/firestore")
      await addDoc(collection(db, "whatsappLinks"), {
        userId: user.uid,
        whatsappNumber: normalized,
        linkCode: code,
        linkCodeExpiry: expiryDate,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setLinkCode(code)
    } catch (err) {
      console.error("Error generando código:", err)
      setError("Error al generar código. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUnlink = async () => {
    if (!user || !linkedNumber) return

    if (!confirm("¿Estás seguro de que quieres desvincular tu WhatsApp?")) {
      return
    }

    try {
      setLoading(true)
      const linksRef = collection(db, "whatsappLinks")
      const q = query(
        linksRef,
        where("userId", "==", user.uid),
        where("whatsappNumber", "==", linkedNumber),
        where("isActive", "==", true)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const linkDoc = snapshot.docs[0]
        await updateDoc(doc(db, "whatsappLinks", linkDoc.id), {
          isActive: false,
          updatedAt: new Date(),
        })

        setIsLinked(false)
        setLinkedNumber(null)
        setLinkCode(null)
      }
    } catch (err) {
      console.error("Error desvinculando:", err)
      setError("Error al desvincular. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingLink) {
    return (
      <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className={`h-8 w-8 animate-spin ${modernTheme.colors.primaryText}`} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-3 ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
          <MessageCircle className="h-5 w-5" />
          Integración con WhatsApp
        </CardTitle>
        <CardDescription className={modernTheme.colors.mutedForeground}>
          Crea tareas desde WhatsApp enviando mensajes de texto o notas de voz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de vinculación */}
        {isLinked ? (
          <div className={`${modernTheme.colors.cardGreen} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className={`h-6 w-6 ${modernTheme.colors.textGreen} mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.textGreen} mb-2`}>
                  WhatsApp Vinculado
                </h4>
                <p className={`text-sm ${modernTheme.colors.mutedForeground} mb-2`}>
                  Número: +{linkedNumber}
                </p>
                <p className={`text-sm ${modernTheme.colors.mutedForeground} mb-4`}>
                  Ahora puedes enviar mensajes al bot de WhatsApp para crear tareas automáticamente.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={loading}
                  className={`${modernTheme.container.radius} ${modernTheme.effects.transition}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Desvinculando...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Desvincular
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Formulario de vinculación */}
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${modernTheme.colors.primaryText} mb-2 block`}>
                  Número de WhatsApp
                </label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    disabled={loading || !!linkCode}
                    className={`flex-1 ${modernTheme.container.radius}`}
                  />
                  <Button
                    onClick={handleGenerateCode}
                    disabled={loading || !whatsappNumber.trim() || !!linkCode}
                    className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Generar Código
                      </>
                    )}
                  </Button>
                </div>
                <p className={`text-xs ${modernTheme.colors.mutedForeground} mt-1`}>
                  Incluye el código de país (ej: +54 para Argentina)
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className={modernTheme.container.radius}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Código de vinculación generado */}
              {linkCode && (
                <div className={`${modernTheme.colors.cardBlue} p-6 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
                  <div className="text-center space-y-4">
                    <div>
                      <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.textBlue} mb-2`}>
                        Código de Vinculación
                      </h4>
                      <div className="flex items-center justify-center gap-3">
                        <div className={`text-3xl font-bold ${modernTheme.colors.primaryText} tracking-wider`}>
                          {linkCode}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyCode}
                          className={modernTheme.container.radius}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-left">
                      <p className={modernTheme.colors.mutedForeground}>
                        <strong>Paso 1:</strong> Abre WhatsApp en tu teléfono
                      </p>
                      <p className={modernTheme.colors.mutedForeground}>
                        <strong>Paso 2:</strong> Envía este código de 6 dígitos al número del bot
                      </p>
                      <p className={modernTheme.colors.mutedForeground}>
                        <strong>Paso 3:</strong> Recibirás una confirmación cuando tu cuenta esté vinculada
                      </p>
                    </div>

                    <Badge variant="outline" className={`${modernTheme.colors.badgeAmber} ${modernTheme.container.radius}`}>
                      El código expira en 15 minutos
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Instrucciones */}
            <div className={`${modernTheme.effects.glass} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
              <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.primaryText} mb-3`}>
                ¿Cómo funciona?
              </h4>
              <ul className={`space-y-2 text-sm ${modernTheme.colors.mutedForeground}`}>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">1.</span>
                  <span>Ingresa tu número de WhatsApp y genera un código de vinculación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">2.</span>
                  <span>Envía el código al bot de WhatsApp para vincular tu cuenta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">3.</span>
                  <span>Envía mensajes de texto o notas de voz para crear tareas automáticamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">4.</span>
                  <span>La IA procesará tu mensaje y extraerá título, contexto, fecha y categoría GTD</span>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Ejemplos de uso */}
        <div className={`${modernTheme.effects.glass} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
          <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.primaryText} mb-3`}>
            Ejemplos de mensajes
          </h4>
          <div className="space-y-2 text-sm">
            <div className={`${modernTheme.colors.cardBlue} p-3 ${modernTheme.container.radius}`}>
              <p className={modernTheme.colors.mutedForeground}>
                <strong className={modernTheme.colors.primaryText}>Texto:</strong> "Llamar al dentista mañana a las 3pm"
              </p>
              <p className={`text-xs ${modernTheme.colors.mutedForeground} mt-1`}>
                → Crea tarea con fecha y hora
              </p>
            </div>
            <div className={`${modernTheme.colors.cardGreen} p-3 ${modernTheme.container.radius}`}>
              <p className={modernTheme.colors.mutedForeground}>
                <strong className={modernTheme.colors.primaryText}>Texto:</strong> "Comprar leche y pan @compras"
              </p>
              <p className={`text-xs ${modernTheme.colors.mutedForeground} mt-1`}>
                → Crea tarea en contexto "compras"
              </p>
            </div>
            <div className={`${modernTheme.colors.cardPurple} p-3 ${modernTheme.container.radius}`}>
              <p className={modernTheme.colors.mutedForeground}>
                <strong className={modernTheme.colors.primaryText}>Audio:</strong> (Nota de voz describiendo una idea)
              </p>
              <p className={`text-xs ${modernTheme.colors.mutedForeground} mt-1`}>
                → Transcribe y crea tarea automáticamente
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
