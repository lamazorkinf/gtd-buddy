"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useTeams } from "@/hooks/use-teams"
import type { Team, TeamRole } from "@/types/task"

interface TeamWithRole extends Team {
  userRole: TeamRole | null
}

interface TeamContextType {
  // Estado del equipo seleccionado
  selectedTeamId: string | null // null = "Personal", string = teamId
  isPersonalMode: boolean // true si selectedTeamId === null

  // Datos del equipo actual
  currentTeam: TeamWithRole | null
  currentUserRole: TeamRole | null

  // Lista de equipos disponibles
  teams: TeamWithRole[]
  loadingTeams: boolean

  // Acciones
  setSelectedTeam: (teamId: string | null) => void
  switchToPersonal: () => void
  switchToTeam: (teamId: string) => void

  // Estado
  loading: boolean
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

const STORAGE_KEY = "gtd-buddy-selected-team"

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Obtener equipos del usuario
  const { teams, loading: loadingTeams, getTeamById } = useTeams()

  // Cargar selección guardada desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      // "personal" → null, teamId → teamId
      const teamId = saved === "personal" ? null : saved
      setSelectedTeamId(teamId)
    }

    setIsInitialized(true)
  }, [])

  // Guardar selección en localStorage cuando cambie
  useEffect(() => {
    if (!isInitialized) return

    const valueToSave = selectedTeamId === null ? "personal" : selectedTeamId
    localStorage.setItem(STORAGE_KEY, valueToSave)
  }, [selectedTeamId, isInitialized])

  // Verificar que el equipo seleccionado todavía existe en la lista
  useEffect(() => {
    if (!isInitialized || loadingTeams) return

    // Si hay un teamId seleccionado pero no está en la lista, volver a Personal
    if (selectedTeamId !== null) {
      const teamExists = teams.some((t) => t.id === selectedTeamId)

      if (!teamExists) {
        console.warn(`Equipo ${selectedTeamId} no encontrado, cambiando a Personal`)
        setSelectedTeamId(null)
      }
    }
  }, [selectedTeamId, teams, loadingTeams, isInitialized])

  // Obtener datos del equipo actual
  const currentTeam = useMemo((): TeamWithRole | null => {
    if (selectedTeamId === null) return null
    return getTeamById(selectedTeamId) || null
  }, [selectedTeamId, getTeamById])

  // Obtener rol del usuario en el equipo actual
  const currentUserRole = useMemo((): TeamRole | null => {
    return currentTeam?.userRole || null
  }, [currentTeam])

  // Modo personal (selectedTeamId === null)
  const isPersonalMode = selectedTeamId === null

  // Acciones
  const switchToPersonal = useCallback(() => {
    setSelectedTeamId(null)
  }, [])

  const switchToTeam = useCallback(
    (teamId: string) => {
      const teamExists = teams.some((t) => t.id === teamId)

      if (!teamExists) {
        console.error(`Equipo ${teamId} no existe`)
        return
      }

      setSelectedTeamId(teamId)
    },
    [teams]
  )

  const value: TeamContextType = {
    selectedTeamId,
    isPersonalMode,
    currentTeam,
    currentUserRole,
    teams,
    loadingTeams,
    setSelectedTeam: setSelectedTeamId,
    switchToPersonal,
    switchToTeam,
    loading: !isInitialized || loadingTeams,
  }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeamContext() {
  const context = useContext(TeamContext)

  if (context === undefined) {
    throw new Error("useTeamContext must be used within a TeamProvider")
  }

  return context
}
