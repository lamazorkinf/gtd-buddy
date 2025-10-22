"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import type { TeamMember, TeamRole } from "@/types/task"
import { useToast } from "@/hooks/use-toast"

export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Real-time listener para miembros del equipo
  useEffect(() => {
    if (!teamId) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(collection(db, "teams", teamId, "members"), orderBy("joinedAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const membersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          joinedAt: doc.data().joinedAt?.toDate?.() || doc.data().joinedAt,
        })) as TeamMember[]

        setMembers(membersData)
        setLoading(false)
      },
      (err) => {
        console.error("Error en listener de miembros:", err)
        setError(err.message || "Error al cargar miembros")
        setLoading(false)
      }
    )

    return unsubscribe
  }, [teamId])

  // Obtener rol del usuario actual en este equipo
  const currentUserRole = useCallback((): TeamRole | null => {
    if (!user || !members.length) return null
    const currentMember = members.find((m) => m.userId === user.uid)
    return currentMember?.role || null
  }, [user, members])

  // Verificar si el usuario puede gestionar miembros
  const canManageMembers = useCallback((): boolean => {
    const role = currentUserRole()
    return role === "owner" || role === "admin"
  }, [currentUserRole])

  // Verificar si el usuario es owner
  const isOwner = useCallback((): boolean => {
    const role = currentUserRole()
    return role === "owner"
  }, [currentUserRole])

  // Remover miembro
  const removeMember = useCallback(
    async (userId: string) => {
      if (!teamId) {
        throw new Error("No hay equipo seleccionado")
      }

      try {
        const response = await apiClient.removeMember(teamId, userId)

        toast({
          title: "Miembro removido",
          description: response.message || "El miembro ha sido removido del equipo",
        })

        return response
      } catch (err: any) {
        console.error("Error al remover miembro:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo remover el miembro",
          variant: "destructive",
        })
        throw err
      }
    },
    [teamId, toast]
  )

  // Cambiar rol de miembro
  const updateMemberRole = useCallback(
    async (userId: string, newRole: TeamRole) => {
      if (!teamId) {
        throw new Error("No hay equipo seleccionado")
      }

      try {
        const response = await apiClient.updateMemberRole(teamId, userId, newRole)

        toast({
          title: "Rol actualizado",
          description: response.message || `Rol cambiado a ${newRole}`,
        })

        return response
      } catch (err: any) {
        console.error("Error al cambiar rol:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo cambiar el rol",
          variant: "destructive",
        })
        throw err
      }
    },
    [teamId, toast]
  )

  // Abandonar equipo (el usuario se remueve a sí mismo)
  const leaveTeam = useCallback(async () => {
    if (!user || !teamId) {
      throw new Error("No hay usuario o equipo seleccionado")
    }

    // No permitir que el owner abandone el equipo
    if (isOwner()) {
      toast({
        title: "No permitido",
        description: "El owner debe transferir la propiedad antes de abandonar el equipo",
        variant: "destructive",
      })
      throw new Error("El owner no puede abandonar el equipo")
    }

    try {
      await removeMember(user.uid)
    } catch (err) {
      throw err
    }
  }, [user, teamId, isOwner, removeMember, toast])

  // Obtener miembro por userId
  const getMemberById = useCallback(
    (userId: string): TeamMember | undefined => {
      return members.find((m) => m.userId === userId)
    },
    [members]
  )

  // Obtener miembros por rol
  const getMembersByRole = useCallback(
    (role: TeamRole): TeamMember[] => {
      return members.filter((m) => m.role === role)
    },
    [members]
  )

  return {
    members,
    loading,
    error,
    currentUserRole: currentUserRole(),
    canManageMembers: canManageMembers(),
    isOwner: isOwner(),
    removeMember,
    updateMemberRole,
    leaveTeam,
    getMemberById,
    getMembersByRole,
  }
}
