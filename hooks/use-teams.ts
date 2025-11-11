"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, collectionGroup, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import type { Team, TeamRole } from "@/types/task"
import { useToast } from "@/hooks/use-toast"

interface TeamWithRole extends Team {
  userRole: TeamRole | null
}

export function useTeams() {
  const [teams, setTeams] = useState<TeamWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Real-time listener para equipos del usuario
  useEffect(() => {
    if (!user) {
      setTeams([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Query usando collectionGroup para buscar en todas las subcollections "members"
    const q = query(collectionGroup(db, "members"), where("userId", "==", user.uid))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Obtener teamIds únicos
          const teamIds = [...new Set(snapshot.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean))] as string[]

          if (teamIds.length === 0) {
            setTeams([])
            setLoading(false)
            return
          }

          // Obtener datos de los equipos
          const teamsPromises = teamIds.map((teamId) => getDoc(doc(db, "teams", teamId)))

          const teamsDocs = await Promise.all(teamsPromises)

          // Obtener rol del usuario en cada equipo
          const teamsWithRole: TeamWithRole[] = await Promise.all(
            teamsDocs
              .filter((teamDoc) => teamDoc.exists())
              .map(async (teamDoc) => {
                const teamData = teamDoc.data()
                const teamId = teamDoc.id

                // Obtener rol del usuario en este equipo
                const memberDoc = snapshot.docs.find(
                  (doc) => doc.ref.parent.parent?.id === teamId && doc.data().userId === user.uid
                )

                const userRole = (memberDoc?.data()?.role as TeamRole) || null

                return {
                  id: teamId,
                  ...teamData,
                  createdAt: teamData.createdAt?.toDate?.() || teamData.createdAt,
                  updatedAt: teamData.updatedAt?.toDate?.() || teamData.updatedAt,
                  subscriptionEndDate: teamData.subscriptionEndDate?.toDate?.() || teamData.subscriptionEndDate,
                  trialStartDate: teamData.trialStartDate?.toDate?.() || teamData.trialStartDate,
                  userRole,
                } as TeamWithRole
              })
          )

          setTeams(teamsWithRole)
          setLoading(false)
        } catch (err: any) {
          console.error("Error al cargar equipos:", err)
          setError(err.message || "Error al cargar equipos")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error en listener de equipos:", err)
        setError(err.message || "Error en tiempo real")
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  // Crear equipo
  const createTeam = useCallback(
    async (data: { name: string; description?: string }) => {
      try {
        const response = await apiClient.createTeam(data)

        toast({
          title: "Equipo creado",
          description: `${data.name} ha sido creado exitosamente`,
        })

        return response.team
      } catch (err: any) {
        console.error("Error al crear equipo:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo crear el equipo",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast]
  )

  // Actualizar equipo
  const updateTeam = useCallback(
    async (
      teamId: string,
      updates: {
        name?: string
        description?: string
        settings?: any
      }
    ) => {
      try {
        const response = await apiClient.updateTeam(teamId, updates)

        toast({
          title: "Equipo actualizado",
          description: "Los cambios han sido guardados",
        })

        return response.team
      } catch (err: any) {
        console.error("Error al actualizar equipo:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo actualizar el equipo",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast]
  )

  // Eliminar equipo
  const deleteTeam = useCallback(
    async (teamId: string) => {
      try {
        const response = await apiClient.deleteTeam(teamId)

        toast({
          title: "Equipo eliminado",
          description: response.message || "El equipo ha sido eliminado",
        })

        return response
      } catch (err: any) {
        console.error("Error al eliminar equipo:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo eliminar el equipo",
          variant: "destructive",
        })
        throw err
      }
    },
    [toast]
  )

  // Obtener equipo específico
  const getTeamById = useCallback((teamId: string): TeamWithRole | undefined => {
    return teams.find((team) => team.id === teamId)
  }, [teams])

  // Verificar si el usuario es admin/owner de un equipo
  const isTeamAdmin = useCallback(
    (teamId: string): boolean => {
      const team = teams.find((t) => t.id === teamId)
      return team?.userRole === "admin" || team?.userRole === "owner"
    },
    [teams]
  )

  // Verificar si el usuario es owner de un equipo
  const isTeamOwner = useCallback(
    (teamId: string): boolean => {
      const team = teams.find((t) => t.id === teamId)
      return team?.userRole === "owner"
    },
    [teams]
  )

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    getTeamById,
    isTeamAdmin,
    isTeamOwner,
  }
}
