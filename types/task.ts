export type GTDCategory = "Inbox" | "Próximas acciones" | "Multitarea" | "A la espera" | "Algún día"

export interface Context {
  id: string
  name: string
  description?: string
  status?: "active" | "inactive"
  userId: string
  createdAt: Date
  updatedAt?: Date
  lastReviewed?: Date
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  dueDate?: Date // Nueva propiedad para fecha de vencimiento
}

export interface Task {
  id: string
  title: string
  description?: string
  category: GTDCategory
  dueDate?: Date
  completed: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  // Nuevos campos GTD
  contextId?: string
  estimatedMinutes?: number
  isQuickAction?: boolean // Para la regla de 2 minutos
  lastReviewed?: Date
  subtasks?: Subtask[] // Array de subtareas
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: "admin" | "user" | "test"
  subscriptionStatus?: "active" | "inactive" | "trial" | "pending_payment" | "test"
  subscriptionEndDate?: Date
  firstName?: string
  lastName?: string
  isInTrialPeriod?: boolean // Campo para manejar el período de prueba
  trialStartDate?: Date // Opcional: para rastrear cuándo comenzó la prueba
  showMessage?: boolean // Campo para controlar si mostrar el mensaje de bienvenida a usuarios test
}
