"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, Target, Plus, Calendar, CheckCircle, ArrowLeft, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { checkSubscriptionStatus } from "@/lib/subscription-utils"
import ContextForm from "@/components/contexts/context-form"
import ContextList from "@/components/contexts/context-list"
import WhatsAppLinking from "@/components/profile/whatsapp-linking"
import type { Context } from "@/types/task"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { modernTheme } from "@/lib/theme"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [showContextForm, setShowContextForm] = useState(false)
  const [editingContext, setEditingContext] = useState<Context | undefined>(undefined)

  const subscriptionStatus = checkSubscriptionStatus(user)

  const handleEditContext = (context: Context) => {
    setEditingContext(context)
    setShowContextForm(true)
  }

  const handleCreateTask = (contextId: string) => {
    // Esta función se puede implementar más tarde si es necesaria
    console.log("Create task for context:", contextId)
  }

  const handleCloseContextForm = () => {
    setShowContextForm(false)
    setEditingContext(undefined)
  }

  const handleGoBack = () => {
    router.back()
  }

  const getSubscriptionStatusBadge = () => {
    if (subscriptionStatus.isInTrial) {
      return (
        <Badge variant="outline" className={`${modernTheme.colors.badgeAmber} ${modernTheme.container.radius}`}>
          Período de Prueba
        </Badge>
      )
    }
    if (subscriptionStatus.isActive) {
      return (
        <Badge variant="outline" className={`${modernTheme.colors.badgeGreen} ${modernTheme.container.radius}`}>
          Activa
        </Badge>
      )
    }
    if (subscriptionStatus.isExpired) {
      return (
        <Badge variant="outline" className={`${modernTheme.colors.badgeRed} ${modernTheme.container.radius}`}>
          Expirada
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className={`${modernTheme.colors.badgeBlue} ${modernTheme.container.radius}`}>
        Inactiva
      </Badge>
    )
  }

  // Obtener el nombre del usuario o su email si no hay nombre
  const userName = user?.displayName || user?.email?.split("@")[0] || "Usuario"

  return (
    <div className={`min-h-screen w-full ${modernTheme.colors.bg}`}>
      <div className="w-full p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Botón para volver atrás */}
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className={`mb-4 text-slate-600 hover:text-purple-700 ${modernTheme.effects.transition} -ml-2`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          {/* Nombre del usuario */}
          <div className="mb-2">
            <h2 className={`text-xl font-medium ${modernTheme.colors.mutedForeground}`}>
              Hola, <span className={`${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>{userName}</span>
            </h2>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>Mi Perfil</h1>
            <p className={modernTheme.colors.mutedForeground}>Gestiona tus contextos y suscripción.</p>
          </div>

          <Tabs defaultValue="contexts" className="space-y-6">
            <TabsList className={`grid w-full ${subscriptionStatus.canAccessDashboard ? 'grid-cols-3' : 'grid-cols-2'} ${modernTheme.effects.glass} ${modernTheme.container.radius}`}>
              <TabsTrigger value="contexts" className={`flex items-center gap-2 ${modernTheme.container.radius}`}>
                <Target className="h-4 w-4" />
                Contextos
              </TabsTrigger>
              {subscriptionStatus.canAccessDashboard && (
                <TabsTrigger value="whatsapp" className={`flex items-center gap-2 ${modernTheme.container.radius}`}>
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </TabsTrigger>
              )}
              <TabsTrigger value="subscription" className={`flex items-center gap-2 ${modernTheme.container.radius}`}>
                <CreditCard className="h-4 w-4" />
                Suscripción
              </TabsTrigger>
            </TabsList>

            {/* Pestaña de Contextos */}
            <TabsContent value="contexts" className="space-y-6">
              <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`flex items-center gap-3 ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
                      <Target className="h-5 w-5" />
                      Gestión de Contextos
                    </CardTitle>
                    <Dialog open={showContextForm} onOpenChange={setShowContextForm}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingContext(undefined)
                            setShowContextForm(true)
                          }}
                          className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius} ${modernTheme.effects.transition}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Contexto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.shadow} ${modernTheme.container.radius}`}>
                        <DialogHeader>
                          <DialogTitle className={modernTheme.colors.primaryText}>{editingContext ? "Editar Contexto" : "Nuevo Contexto"}</DialogTitle>
                        </DialogHeader>
                        <ContextForm context={editingContext} onClose={handleCloseContextForm} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ContextList onEditContext={handleEditContext} onCreateTask={handleCreateTask} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña de WhatsApp */}
            {subscriptionStatus.canAccessDashboard && (
              <TabsContent value="whatsapp" className="space-y-6">
                <WhatsAppLinking />
              </TabsContent>
            )}

            {/* Pestaña de Suscripción */}
            <TabsContent value="subscription" className="space-y-6">
              <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-3 ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
                    <CreditCard className="h-5 w-5" />
                    Gestión de Suscripción
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Estado actual */}
                  <div className={`${modernTheme.effects.glass} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>Estado Actual</h3>
                      {getSubscriptionStatusBadge()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className={modernTheme.colors.mutedForeground}>Estado:</span>
                        <p className={`font-medium ${modernTheme.colors.primaryText}`}>{subscriptionStatus.reason}</p>
                      </div>
                      {user?.subscriptionEndDate && (
                        <div>
                          <span className={modernTheme.colors.mutedForeground}>Fecha de Expiración:</span>
                          <p className={`font-medium ${modernTheme.colors.primaryText}`}>
                            {format(
                              user.subscriptionEndDate instanceof Date
                                ? user.subscriptionEndDate
                                : new Date((user.subscriptionEndDate as any)?.seconds * 1000 || user.subscriptionEndDate),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: es },
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones de suscripción */}
                  <div className="space-y-4">
                    {!subscriptionStatus.isActive && (
                      <div className={`${modernTheme.colors.cardBlue} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
                        <div className="flex items-start gap-3">
                          <CheckCircle className={`h-6 w-6 ${modernTheme.colors.textBlue} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1">
                            <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.textBlue} mb-2`}>Activa tu Suscripción</h4>
                            <p className={`text-sm ${modernTheme.colors.mutedForeground} mb-4`}>
                              Obtén acceso completo a todas las funcionalidades de GTD Buddy y mejora tu productividad.
                            </p>
                            <Button
                              className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius}`}
                              onClick={() => (window.location.href = "/subscription")}
                            >
                              Ver Planes de Suscripción
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {subscriptionStatus.isActive && (
                      <div className={`${modernTheme.colors.cardGreen} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
                        <div className="flex items-start gap-3">
                          <CheckCircle className={`h-6 w-6 ${modernTheme.colors.textGreen} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1">
                            <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.textGreen} mb-2`}>Suscripción Activa</h4>
                            <p className={`text-sm ${modernTheme.colors.mutedForeground} mb-4`}>
                              Tu suscripción está activa y tienes acceso a todas las funcionalidades.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/subscription/cancel')}
                                className={modernTheme.container.radius}
                              >
                                Gestionar Suscripción
                              </Button>
                              <Button variant="outline" size="sm" className={modernTheme.container.radius}>
                                Descargar Factura
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {subscriptionStatus.isExpired && (
                      <div className={`${modernTheme.colors.cardRed} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
                        <div className="flex items-start gap-3">
                          <Calendar className={`h-6 w-6 ${modernTheme.colors.textRed} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1">
                            <h4 className={`${modernTheme.typography.heading} ${modernTheme.colors.textRed} mb-2`}>Suscripción Expirada</h4>
                            <p className={`text-sm ${modernTheme.colors.mutedForeground} mb-4`}>
                              Tu suscripción ha expirado. Renueva para continuar usando todas las funcionalidades.
                            </p>
                            <Button
                              className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius}`}
                              onClick={() => (window.location.href = "/subscription")}
                            >
                              Renovar Suscripción
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
