"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, Target, Plus, Calendar, CheckCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { checkSubscriptionStatus } from "@/lib/subscription-utils"
import ContextForm from "@/components/contexts/context-form"
import ContextList from "@/components/contexts/context-list"
import type { Context } from "@/types/task"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

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
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Período de Prueba
        </Badge>
      )
    }
    if (subscriptionStatus.isActive) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          Activa
        </Badge>
      )
    }
    if (subscriptionStatus.isExpired) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          Expirada
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
        Inactiva
      </Badge>
    )
  }

  // Obtener el nombre del usuario o su email si no hay nombre
  const userName = user?.displayName || user?.email?.split("@")[0] || "Usuario"

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Botón para volver atrás */}
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Nombre del usuario */}
        <div className="mb-2">
          <h2 className="text-xl font-medium text-gray-600">
            Hola, <span className="font-semibold text-gray-900">{userName}</span>
          </h2>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
          <p className="text-gray-500">Gestiona tus contextos y suscripción.</p>
        </div>

        <Tabs defaultValue="contexts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contexts" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Contextos
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Suscripción
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Contextos */}
          <TabsContent value="contexts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-gray-700">
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
                        className="bg-gray-800 hover:bg-gray-900 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Contexto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingContext ? "Editar Contexto" : "Nuevo Contexto"}</DialogTitle>
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

          {/* Pestaña de Suscripción */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-700">
                  <CreditCard className="h-5 w-5" />
                  Gestión de Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estado actual */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Estado Actual</h3>
                    {getSubscriptionStatusBadge()}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Estado:</span>
                      <p className="font-medium text-gray-800">{subscriptionStatus.reason}</p>
                    </div>
                    {user?.subscriptionEndDate && (
                      <div>
                        <span className="text-gray-600">Fecha de Expiración:</span>
                        <p className="font-medium text-gray-800">
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
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-700 mb-2">Activa tu Suscripción</h4>
                          <p className="text-sm text-blue-600 mb-4">
                            Obtén acceso completo a todas las funcionalidades de GTD Buddy y mejora tu productividad.
                          </p>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => (window.location.href = "/subscription")}
                          >
                            Ver Planes de Suscripción
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptionStatus.isActive && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-700 mb-2">Suscripción Activa</h4>
                          <p className="text-sm text-green-600 mb-4">
                            Tu suscripción está activa y tienes acceso a todas las funcionalidades.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Gestionar Suscripción
                            </Button>
                            <Button variant="outline" size="sm">
                              Descargar Factura
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptionStatus.isExpired && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-700 mb-2">Suscripción Expirada</h4>
                          <p className="text-sm text-red-600 mb-4">
                            Tu suscripción ha expirado. Renueva para continuar usando todas las funcionalidades.
                          </p>
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
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
  )
}
