export type GTDCategory = "Inbox" | "Próximas acciones" | "Multitarea" | "A la espera" | "Algún día"

export interface Context {
  id: string
  name: string
  description?: string
  status?: "active" | "inactive"
  userId: string
  teamId?: string // Contexto puede ser de un equipo
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
  // Campos para trabajo en equipo
  teamId?: string // null = tarea personal, valor = tarea de equipo
  assignedTo?: string // userId del miembro asignado (solo si teamId existe)
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  phoneNumber?: string | null // Número de WhatsApp para vincular cuenta
  role: "admin" | "user" | "test"
  subscriptionStatus?: "active" | "inactive" | "trial" | "pending_payment" | "test"
  subscriptionEndDate?: Date
  firstName?: string
  lastName?: string
  isInTrialPeriod?: boolean // Campo para manejar el período de prueba
  trialStartDate?: Date // Opcional: para rastrear cuándo comenzó la prueba
  showMessage?: boolean // Campo para controlar si mostrar el mensaje de bienvenida a usuarios test
  teams?: string[] // Array de teamIds donde el usuario es miembro
}

// Tipos para trabajo en equipo

export type TeamRole = "owner" | "admin" | "member"

export type TeamSubscriptionStatus = "trial" | "active" | "inactive" | "pending_payment" | "pending_cancellation"

export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired"

export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string // Usuario que creó el equipo
  subscriptionStatus: TeamSubscriptionStatus
  mercadoPagoSubscriptionId?: string // ID de suscripción en MercadoPago
  subscriptionEndDate?: Date
  trialStartDate?: Date
  settings: TeamSettings
  createdAt: Date
  updatedAt: Date
}

export interface TeamSettings {
  defaultTaskCategory?: GTDCategory
  allowMemberInvites: boolean // Si los miembros pueden invitar a otros
  requireTaskAssignment?: boolean // Si las tareas deben tener asignado
}

export interface TeamMember {
  id: string // Documento ID en Firestore
  teamId: string
  userId: string
  role: TeamRole
  invitedBy: string // userId de quien invitó
  joinedAt: Date
  // Datos desnormalizados del usuario para queries rápidas
  displayName?: string
  email?: string
  photoURL?: string
}

export interface TeamInvitation {
  id: string
  teamId: string
  email: string // Email del invitado
  invitedBy: string // userId de quien invitó
  role: TeamRole // Rol que tendrá al aceptar (por defecto "member")
  status: InvitationStatus
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
  rejectedAt?: Date
}
