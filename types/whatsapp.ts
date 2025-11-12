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
