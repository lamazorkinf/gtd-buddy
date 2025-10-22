"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import type { TeamInvitation, TeamRole } from "@/types/task"
import { useToast } from "@/hooks/use-toast"

interface UseTeamInvitationsOptions {
  watchTeamId?: string | null // Si se proporciona, escucha invitaciones del equipo en real-time
  autoFetchUserInvitations?: boolean // Si true, carga invitaciones del usuario al montar
}

export function useTeamInvitations(options: UseTeamInvitationsOptions = {}) {
  const { watchTeamId, autoFetchUserInvitations = false } = options

  const [userInvitations, setUserInvitations] = useState<TeamInvitation[]>([])
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([])
  const [loadingUserInvitations, setLoadingUserInvitations] = useState(false)
  const [loadingTeamInvitations, setLoadingTeamInvitations] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  // Real-time listener para invitaciones del equipo
  useEffect(() => {
    if (!watchTeamId) {
      setTeamInvitations([])
      setLoadingTeamInvitations(false)
      return
    }

    setLoadingTeamInvitations(true)
    setError(null)

    const q = query(
      collection(db, "teamInvitations"),
      where("teamId", "==", watchTeamId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invitationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          expiresAt: doc.data().expiresAt?.toDate?.() || doc.data().expiresAt,
          acceptedAt: doc.data().acceptedAt?.toDate?.() || null,
          rejectedAt: doc.data().rejectedAt?.toDate?.() || null,
        })) as TeamInvitation[]

        setTeamInvitations(invitationsData)
        setLoadingTeamInvitations(false)
      },
      (err) => {
        console.error("Error en listener de invitaciones del equipo:", err)
        setError(err.message || "Error al cargar invitaciones del equipo")
        setLoadingTeamInvitations(false)
      }
    )

    return unsubscribe
  }, [watchTeamId])

  // Cargar invitaciones del usuario (manual, no real-time)
  const fetchUserInvitations = useCallback(async () => {
    if (!user) return

    setLoadingUserInvitations(true)
    setError(null)

    try {
      const response = await apiClient.getUserInvitations()
      setUserInvitations(response.invitations || [])
    } catch (err: any) {
      console.error("Error al cargar invitaciones del usuario:", err)
      setError(err.message || "Error al cargar invitaciones")
    } finally {
      setLoadingUserInvitations(false)
    }
  }, [user])

  // Auto-fetch invitaciones del usuario al montar
  useEffect(() => {
    if (autoFetchUserInvitations && user) {
      fetchUserInvitations()
    }
  }, [autoFetchUserInvitations, user, fetchUserInvitations])

  // Crear invitación
  const createInvitation = useCallback(
    async (teamId: string, email: string, role: TeamRole = "member") => {
      try {
        const response = await apiClient.createInvitation(teamId, email, role)

        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${email}`,
        })

        return response.invitation
      } catch (err: any) {
        console.error("Error al crear invitación:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo enviar la invitación",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast]
  )

  // Aceptar invitación
  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      try {
        const response = await apiClient.acceptInvitation(invitationId)

        toast({
          title: "¡Bienvenido al equipo!",
          description: response.message || `Te has unido a ${response.team?.name}`,
        })

        // Actualizar lista de invitaciones del usuario
        setUserInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))

        return response.team
      } catch (err: any) {
        console.error("Error al aceptar invitación:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo aceptar la invitación",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast]
  )

  // Rechazar invitación
  const rejectInvitation = useCallback(
    async (invitationId: string) => {
      try {
        const response = await apiClient.rejectInvitation(invitationId)

        toast({
          title: "Invitación rechazada",
          description: response.message || "Has rechazado la invitación",
        })

        // Actualizar lista de invitaciones del usuario
        setUserInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))

        return response
      } catch (err: any) {
        console.error("Error al rechazar invitación:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo rechazar la invitación",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast]
  )

  // Verificar si una invitación ha expirado
  const isInvitationExpired = useCallback((invitation: TeamInvitation): boolean => {
    const now = new Date()
    const expiresAt = invitation.expiresAt instanceof Date ? invitation.expiresAt : new Date(invitation.expiresAt)
    return now > expiresAt
  }, [])

  // Obtener invitaciones válidas (no expiradas)
  const getValidUserInvitations = useCallback((): TeamInvitation[] => {
    return userInvitations.filter((inv) => !isInvitationExpired(inv))
  }, [userInvitations, isInvitationExpired])

  return {
    // Invitaciones del usuario
    userInvitations,
    validUserInvitations: getValidUserInvitations(),
    loadingUserInvitations,

    // Invitaciones del equipo (real-time)
    teamInvitations,
    loadingTeamInvitations,

    // Estado general
    error,
    loading: loadingUserInvitations || loadingTeamInvitations,

    // Acciones
    fetchUserInvitations,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    isInvitationExpired,
  }
}
