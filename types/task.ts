export type GTDCategory = "Inbox" | "Próximas acciones" | "Multitarea" | "A la espera" | "Algún día"
export type Priority = "baja" | "media" | "alta"
export type EnergyLevel = "baja" | "media" | "alta"

export interface Context {
  id: string
  name: string
  description?: string
  status?: "active" | "on_hold" | "completed" | "someday"
  userId: string
  createdAt: Date
  updatedAt?: Date
  lastReviewed?: Date
  targetDate?: Date
}

export interface Task {
  id: string
  title: string
  description?: string
  category: GTDCategory
  dueDate?: Date
  completed: boolean
  priority: Priority
  userId: string
  createdAt: Date
  updatedAt: Date
  // Nuevos campos GTD
  contextId?: string
  energyLevel?: EnergyLevel
  estimatedMinutes?: number
  isQuickAction?: boolean // Para la regla de 2 minutos
  lastReviewed?: Date
}

export interface WeeklyReview {
  id: string
  userId: string
  reviewDate: Date
  inboxProcessed: boolean
  projectsReviewed: boolean
  waitingForUpdated: boolean
  somedayReviewed: boolean
  notes?: string
  createdAt: Date
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: "admin" | "user"
  subscriptionStatus?: "active" | "inactive" | "trial" | "pending_payment"
  subscriptionEndDate?: Date
  firstName?: string
  lastName?: string
  lastWeeklyReview?: Date
}
