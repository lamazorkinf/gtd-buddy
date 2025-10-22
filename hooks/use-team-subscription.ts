"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { apiClient } from "@/lib/api-client"
import type { Team, TeamSubscriptionStatus } from "@/types/task"
import { checkTeamSubscriptionStatus } from "@/lib/team-utils.client"
import { useToast } from "@/hooks/use-toast"

export function useTeamSubscription(teamId: string | null) {
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Real-time listener para datos del equipo
  useEffect(() => {
    if (!teamId) {
      setTeam(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      doc(db, "teams", teamId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const teamData = docSnapshot.data() as Team
          setTeam({
            id: docSnapshot.id,
            ...teamData,
            createdAt: teamData.createdAt?.toDate?.() || teamData.createdAt,
            updatedAt: teamData.updatedAt?.toDate?.() || teamData.updatedAt,
            subscriptionEndDate: teamData.subscriptionEndDate?.toDate?.() || teamData.subscriptionEndDate,
            trialStartDate: teamData.trialStartDate?.toDate?.() || teamData.trialStartDate,
          } as Team)
        } else {
          setTeam(null)
          setError("Equipo no encontrado")
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error en listener de suscripción del equipo:", err)
        setError(err.message || "Error al cargar datos del equipo")
        setLoading(false)
      }
    )

    return unsubscribe
  }, [teamId])

  // Calcular estado de suscripción
  const subscriptionInfo = useMemo(() => {
    if (!team) {
      return {
        isActive: false,
        isExpired: true,
        isInTrial: false,
        canAccessTeam: false,
        reason: "no_team" as const,
      }
    }

    return checkTeamSubscriptionStatus(team)
  }, [team])

  // Calcular días restantes
  const daysRemaining = useMemo((): number | null => {
    if (!team || !team.subscriptionEndDate) return null

    const endDate =
      team.subscriptionEndDate instanceof Date ? team.subscriptionEndDate : new Date(team.subscriptionEndDate)

    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }, [team])

  // Obtener texto del estado de suscripción
  const getSubscriptionStatusText = useCallback((): string => {
    if (!team) return "Sin equipo"

    switch (team.subscriptionStatus) {
      case "trial":
        return `Prueba (${daysRemaining || 0} días restantes)`
      case "active":
        return "Activa"
      case "pending_cancellation":
        return `Activa (cancela en ${daysRemaining || 0} días)`
      case "inactive":
        return "Inactiva"
      case "pending_payment":
        return "Pago pendiente"
      default:
        return "Desconocido"
    }
  }, [team, daysRemaining])

  // Crear suscripción del equipo
  const createSubscription = useCallback(async () => {
    if (!teamId) {
      throw new Error("No hay equipo seleccionado")
    }

    try {
      const response = await apiClient.createTeamSubscription(teamId)

      toast({
        title: "Redirigiendo a MercadoPago",
        description: "Serás redirigido para completar el pago",
      })

      // Redirigir al init_point de MercadoPago
      if (response.init_point) {
        window.location.href = response.init_point
      }

      return response
    } catch (err: any) {
      console.error("Error al crear suscripción del equipo:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear la suscripción",
        variant: "destructive",
      })
      throw err
    }
  }, [teamId, toast])

  // Cancelar suscripción del equipo
  const cancelSubscription = useCallback(async () => {
    if (!teamId) {
      throw new Error("No hay equipo seleccionado")
    }

    try {
      const response = await apiClient.cancelTeamSubscription(teamId)

      toast({
        title: "Suscripción cancelada",
        description: response.note || "El equipo mantendrá acceso hasta la fecha de finalización",
      })

      return response
    } catch (err: any) {
      console.error("Error al cancelar suscripción del equipo:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo cancelar la suscripción",
        variant: "destructive",
      })
      throw err
    }
  }, [teamId, toast])

  return {
    // Datos del equipo
    team,
    loading,
    error,

    // Estado de suscripción
    subscriptionStatus: team?.subscriptionStatus || ("inactive" as TeamSubscriptionStatus),
    subscriptionInfo,
    canAccess: subscriptionInfo.canAccessTeam,
    isInTrial: subscriptionInfo.isInTrial,
    isActive: subscriptionInfo.isActive,
    isExpired: subscriptionInfo.isExpired,

    // Información adicional
    daysRemaining,
    statusText: getSubscriptionStatusText(),

    // Acciones
    createSubscription,
    cancelSubscription,
  }
}
