// Cliente para interactuar con los endpoints de tareas
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Error en la petición")
    }

    return response.json()
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
}

export const apiClient = new ApiClient()
