// Cliente para interactuar con los endpoints de la API
import { auth } from "./firebase"

class ApiClient {
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser
    if (!user) {
      throw new Error("Usuario no autenticado")
    }
    return await user.getIdToken()
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken()

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    // Intentar parsear el body como JSON
    let data: any
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      try {
        data = await response.json()
      } catch {
        data = { error: "Error al parsear respuesta" }
      }
    } else {
      data = { error: await response.text() }
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Error ${response.status}`)
    }

    return data
  }

  // Métodos HTTP genéricos
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: "GET" })
  }

  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: "DELETE" })
  }

  // Listar tareas
  async getTasks(
    filters: {
      category?: string
      contextId?: string
      completed?: boolean
      limit?: number
    } = {},
  ) {
    const params = new URLSearchParams()

    if (filters.category) params.append("category", filters.category)
    if (filters.contextId) params.append("contextId", filters.contextId)
    if (filters.completed !== undefined) params.append("completed", filters.completed.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())

    const queryString = params.toString()
    const endpoint = `/api/tasks${queryString ? `?${queryString}` : ""}`

    return this.request(endpoint)
  }

  // Crear tarea completa
  async createTask(taskData: {
    title: string
    description?: string
    category: string
    priority: string
    dueDate?: string
    contextId?: string
    energyLevel?: string
    estimatedMinutes?: number
    isQuickAction?: boolean
  }) {
    return this.request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    })
  }

  // Captura rápida
  async quickCapture(data: {
    title: string
    description?: string
  }) {
    return this.request("/api/tasks/quick-capture", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // ============ TEAMS API ============

  // Listar equipos del usuario
  async getTeams() {
    return this.get("/api/teams")
  }

  // Crear equipo
  async createTeam(data: { name: string; description?: string }) {
    return this.post("/api/teams", data)
  }

  // Obtener equipo específico
  async getTeam(teamId: string) {
    return this.get(`/api/teams/${teamId}`)
  }

  // Actualizar equipo
  async updateTeam(teamId: string, data: { name?: string; description?: string; settings?: any }) {
    return this.put(`/api/teams/${teamId}`, data)
  }

  // Eliminar equipo
  async deleteTeam(teamId: string) {
    return this.delete(`/api/teams/${teamId}`)
  }

  // ============ TEAM MEMBERS API ============

  // Listar miembros del equipo
  async getTeamMembers(teamId: string) {
    return this.get(`/api/teams/${teamId}/members`)
  }

  // Remover miembro
  async removeMember(teamId: string, userId: string) {
    return this.delete(`/api/teams/${teamId}/members?userId=${userId}`)
  }

  // Cambiar rol de miembro
  async updateMemberRole(teamId: string, userId: string, newRole: string) {
    return this.put(`/api/teams/${teamId}/members/role`, { userId, newRole })
  }

  // ============ TEAM INVITATIONS API ============

  // Crear invitación
  async createInvitation(teamId: string, email: string, role: string = "member") {
    return this.post(`/api/teams/${teamId}/invite`, { email, role })
  }

  // Listar invitaciones del equipo
  async getTeamInvitations(teamId: string, status?: string) {
    const query = status ? `?status=${status}` : ""
    return this.get(`/api/teams/${teamId}/invite${query}`)
  }

  // Listar invitaciones del usuario actual
  async getUserInvitations() {
    return this.get("/api/teams/invitations")
  }

  // Aceptar invitación
  async acceptInvitation(invitationId: string) {
    return this.post(`/api/teams/invitations/${invitationId}/accept`)
  }

  // Rechazar invitación
  async rejectInvitation(invitationId: string) {
    return this.post(`/api/teams/invitations/${invitationId}/reject`)
  }

  // ============ TEAM SUBSCRIPTION API ============

  // Crear suscripción de equipo
  async createTeamSubscription(teamId: string) {
    return this.post(`/api/teams/${teamId}/subscription`)
  }

  // Cancelar suscripción de equipo
  async cancelTeamSubscription(teamId: string) {
    return this.delete(`/api/teams/${teamId}/subscription`)
  }
}

export const apiClient = new ApiClient()
