"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTeamSubscription } from "@/hooks/use-team-subscription"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TeamSubscriptionCardProps {
  teamId: string
  userRole: "owner" | "admin" | "member" | null
}

export default function TeamSubscriptionCard({ teamId, userRole }: TeamSubscriptionCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const {
    team,
    loading,
    isActive,
    isExpired,
    isInTrial,
    canAccessTeam,
    reason,
    daysRemaining,
    statusText,
    createSubscription,
    cancelSubscription,
  } = useTeamSubscription(teamId)

  const { toast } = useToast()
  const canManageSubscription = userRole === "owner"

  const handleSubscribe = async () => {
    if (!canManageSubscription) return

    try {
      await createSubscription()
      // La redirección a MercadoPago se maneja en el hook
    } catch (error: any) {
      console.error("Error al crear suscripción:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar la suscripción",
        variant: "destructive",
      })
    }
  }

  const handleCancelSubscription = async () => {
    if (!canManageSubscription) return

    setCancelling(true)
    try {
      await cancelSubscription()

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción se cancelará al final del período actual",
      })

      setShowCancelDialog(false)
    } catch (error: any) {
      console.error("Error al cancelar suscripción:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la suscripción",
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = () => {
    if (isInTrial) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Calendar className="h-3 w-3" />
          Prueba
        </Badge>
      )
    }
    if (isActive) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Activa
        </Badge>
      )
    }
    if (team?.subscriptionStatus === "pending_cancellation") {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Cancelación Pendiente
        </Badge>
      )
    }
    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expirada
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        Sin suscripción
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="glassmorphism">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!team) {
    return (
      <Card className="glassmorphism">
        <CardContent className="py-12 text-center text-muted-foreground">
          No se pudo cargar la información de suscripción
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Suscripción del Equipo
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            {canManageSubscription
              ? "Gestiona la suscripción de tu equipo"
              : "Solo el propietario puede gestionar la suscripción"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Estado</p>
            <p className="text-sm text-muted-foreground">{statusText}</p>
          </div>

          {(isInTrial || isActive || team.subscriptionStatus === "pending_cancellation") && team.subscriptionEndDate && (
            <div>
              <p className="text-sm font-medium mb-1">
                {team.subscriptionStatus === "pending_cancellation"
                  ? "Se cancela el"
                  : isInTrial
                    ? "Prueba termina el"
                    : "Próximo pago"}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(team.subscriptionEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                {daysRemaining !== null && daysRemaining >= 0 && (
                  <span className="ml-2">
                    ({daysRemaining} {daysRemaining === 1 ? "día" : "días"} restantes)
                  </span>
                )}
              </p>
            </div>
          )}

          {!canAccessTeam && reason && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Acceso Limitado</p>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
            </div>
          )}
        </CardContent>

        {canManageSubscription && (
          <CardFooter className="flex gap-2">
            {!isActive && team.subscriptionStatus !== "pending_cancellation" && (
              <Button onClick={handleSubscribe} className="flex-1">
                <CreditCard className="mr-2 h-4 w-4" />
                {isInTrial ? "Activar Suscripción" : "Suscribirse"}
              </Button>
            )}

            {(isActive || team.subscriptionStatus === "pending_cancellation") &&
              team.subscriptionStatus !== "pending_cancellation" && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1"
                >
                  Cancelar Suscripción
                </Button>
              )}

            {team.subscriptionStatus === "pending_cancellation" && (
              <div className="flex-1 text-sm text-muted-foreground text-center">
                La suscripción se cancelará automáticamente
              </div>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Dialog de confirmación para cancelar suscripción */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="glassmorphism">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar la suscripción? El equipo mantendrá acceso hasta el
              final del período actual{" "}
              {team.subscriptionEndDate && (
                <>
                  ({format(team.subscriptionEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })})
                </>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Sí, cancelar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
