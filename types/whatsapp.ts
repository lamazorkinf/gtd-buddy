// Tipos para la integración de WhatsApp con Evolution API

export interface WhatsAppLink {
  id: string
  userId: string // Firebase UID
  whatsappNumber: string // Número de WhatsApp con código de país (ej: 5491112345678)
  linkCode?: string // Código temporal para vincular cuenta
  linkCodeExpiry?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WhatsAppMessage {
  key: {
    remoteJid: string // Número del remitente
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string // Mensaje de texto simple
    extendedTextMessage?: {
      text: string
    }
    audioMessage?: {
      url: string
      mimetype: string
      seconds: number
    }
  }
  messageTimestamp: number
  pushName?: string // Nombre del contacto
}

export type UserIntent =
  | "create_task"           // Crear una tarea nueva
  | "view_tasks"            // Ver tareas (inbox, hoy, próximas)
  | "complete_task"         // Marcar tarea como completada
  | "edit_task"             // Editar una tarea existente
  | "add_context"           // Agregar contexto a última tarea
  | "greeting"              // Saludo o conversación casual
  | "help"                  // Pedir ayuda

export interface ConversationContext {
  id: string
  userId: string
  whatsappNumber: string
  lastTaskId?: string       // ID de la última tarea creada/mencionada
  lastIntent?: UserIntent   // Última intención detectada
  conversationHistory: {    // Últimos 5 mensajes para contexto
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }[]
  createdAt: Date
  updatedAt: Date
  expiresAt: Date           // Expira después de 1 hora de inactividad
}

export interface ProcessedTaskData {
  isTask: boolean // true si es una tarea, false si es conversación casual
  title: string
  description?: string
  contextId?: string
  contextName?: string
  dueDate?: Date
  estimatedMinutes?: number
  category: "Inbox" | "Próximas acciones" | "Multitarea" | "A la espera" | "Algún día"
  isQuickAction?: boolean
  confidence: number // 0-1, qué tan seguro está la IA del análisis
}

export interface ProcessedIntent {
  intent: UserIntent
  confidence: number
  parameters?: {
    taskFilter?: "inbox" | "today" | "next_actions" | "all"
    taskId?: string
    contextName?: string
    editField?: "title" | "description" | "dueDate" | "context"
    editValue?: string
  }
  needsContext?: boolean    // Si necesita contexto de conversación previa
  taskData?: ProcessedTaskData // Solo si intent es create_task
}

export interface EvolutionAPIWebhook {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName: string
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
      audioMessage?: {
        url: string
        mimetype: string
        seconds: number
        mediaKey: string
      }
    }
    messageType: "conversation" | "extendedTextMessage" | "audioMessage" | "imageMessage"
    messageTimestamp: number
    instanceId: string
    source: string
  }
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}
