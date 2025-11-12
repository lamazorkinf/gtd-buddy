import OpenAI from "openai"
import type { ProcessedTaskData } from "@/types/whatsapp"
import type { GTDCategory } from "@/types/task"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Descarga audio desde Evolution API (maneja audios encriptados de WhatsApp)
 * @param messageId ID del mensaje
 * @param remoteJid JID del remitente
 * @returns Buffer con el audio desencriptado
 */
async function downloadAudioFromEvolution(messageId: string, remoteJid: string): Promise<Buffer> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!evolutionUrl || !instanceName || !apiKey) {
    throw new Error("Configuración de Evolution API incompleta")
  }

  const url = `${evolutionUrl}/message/download/${instanceName}`

  console.log("📥 Descargando audio desde Evolution API...")

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": apiKey,
    },
    body: JSON.stringify({
      key: {
        id: messageId,
        remoteJid: remoteJid,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Error descargando desde Evolution API: ${response.statusText}`)
  }

  const data = await response.json()

  // Evolution API devuelve el audio en base64
  if (data.base64) {
    const buffer = Buffer.from(data.base64, 'base64')
    console.log("✅ Audio descargado desde Evolution API, tamaño:", buffer.length, "bytes")
    return buffer
  }

  throw new Error("Evolution API no devolvió el audio en formato esperado")
}

/**
 * Transcribe un archivo de audio usando Whisper API
 * @param audioUrl URL del archivo de audio (puede estar encriptado)
 * @param messageId ID del mensaje (para descargar desde Evolution API)
 * @param remoteJid JID del remitente
 * @returns Texto transcrito
 */
export async function transcribeAudio(audioUrl: string, messageId?: string, remoteJid?: string): Promise<string> {
  try {
    let audioBuffer: Buffer
    let mimeType = "audio/ogg"

    // Si el audio está encriptado (.enc), usar Evolution API para descargarlo
    if (audioUrl.includes('.enc') && messageId && remoteJid) {
      console.log("🔐 Audio encriptado detectado, usando Evolution API...")
      audioBuffer = await downloadAudioFromEvolution(messageId, remoteJid)
    } else {
      // Descargar audio directamente
      console.log("🎤 Descargando audio desde:", audioUrl)
      const response = await fetch(audioUrl)

      if (!response.ok) {
        console.error("❌ Error descargando audio:", response.status, response.statusText)
        throw new Error(`Error descargando audio: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      audioBuffer = Buffer.from(arrayBuffer)
      mimeType = response.headers.get("content-type") || "audio/ogg"
    }

    console.log("📦 Audio listo para transcripción, tamaño:", audioBuffer.length, "bytes")

    // Crear blob y file
    const audioBlob = new Blob([audioBuffer], { type: mimeType })
    const audioFile = new File([audioBlob], "audio.ogg", { type: mimeType })

    // Transcribir con Whisper
    console.log("🤖 Enviando a Whisper para transcripción...")
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es", // Español
    })

    console.log("✅ Audio transcrito:", transcription.text.substring(0, 100) + "...")
    return transcription.text
  } catch (error: any) {
    console.error("❌ Error transcribiendo audio:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    })
    throw new Error(`No se pudo transcribir el audio: ${error?.message || "Error desconocido"}`)
  }
}

/**
 * Analiza un texto usando GPT-4 para extraer información de tarea GTD
 * @param text Texto a analizar (puede ser transcripción de audio o texto directo)
 * @returns Datos de tarea procesados
 */
export async function analyzeTaskText(text: string): Promise<ProcessedTaskData> {
  try {
    const systemPrompt = `Eres un asistente experto en el método GTD (Getting Things Done).
Tu trabajo es analizar mensajes de texto y extraer información estructurada para crear tareas.

Categorías GTD disponibles:
- "Inbox": Tareas que aún no se han procesado (por defecto para capturas rápidas)
- "Próximas acciones": Acciones concretas que se pueden hacer ahora
- "Multitarea": Proyectos que requieren múltiples pasos
- "A la espera": Tareas que dependen de alguien más
- "Algún día": Ideas o tareas para el futuro

Contextos comunes: @casa, @oficina, @llamadas, @compras, @computadora, @recados, @reuniones, @email

Regla de 2 minutos: Si la tarea toma menos de 2 minutos, marca isQuickAction como true.

Analiza el siguiente texto y extrae:
1. Título conciso de la tarea (máximo 80 caracteres)
2. Descripción detallada (si hay información adicional)
3. Contexto sugerido (si se menciona o se puede inferir)
4. Fecha de vencimiento (si se menciona "mañana", "próximo lunes", "en 3 días", etc.)
5. Tiempo estimado en minutos (si se menciona)
6. Categoría GTD más apropiada
7. Si aplica la regla de 2 minutos

IMPORTANTE:
- Para capturas rápidas sin procesar, usa siempre "Inbox"
- Solo usa otras categorías si el usuario especifica claramente el tipo de tarea
- Las fechas relativas deben calcularse desde hoy
- Sé conservador con la clasificación: ante la duda, usa "Inbox"

Responde SOLO con un JSON válido, sin markdown ni explicaciones adicionales.`

    const userPrompt = `Fecha de hoy: ${new Date().toISOString().split("T")[0]}

Texto a analizar:
"${text}"

Responde con JSON en este formato:
{
  "title": "string (máximo 80 caracteres)",
  "description": "string (opcional, más detalles)",
  "contextName": "string (opcional, sin @)",
  "dueDate": "YYYY-MM-DD (opcional)",
  "estimatedMinutes": number (opcional),
  "category": "Inbox | Próximas acciones | Multitarea | A la espera | Algún día",
  "isQuickAction": boolean,
  "confidence": number (0.0 a 1.0, qué tan seguro estás del análisis)
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      response_format: { type: "json_object" },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error("No se recibió respuesta de OpenAI")
    }

    const parsed = JSON.parse(responseText)

    // Validar y construir objeto ProcessedTaskData
    const processedData: ProcessedTaskData = {
      title: parsed.title.substring(0, 80), // Asegurar límite de caracteres
      description: parsed.description || undefined,
      contextName: parsed.contextName || undefined,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
      estimatedMinutes: parsed.estimatedMinutes || undefined,
      category: (parsed.category as GTDCategory) || "Inbox",
      isQuickAction: parsed.isQuickAction || false,
      confidence: parsed.confidence || 0.5,
    }

    return processedData
  } catch (error) {
    console.error("Error analizando texto con GPT-4:", error)

    // Fallback: crear tarea básica en Inbox
    return {
      title: text.substring(0, 80),
      description: text.length > 80 ? text : undefined,
      category: "Inbox",
      isQuickAction: false,
      confidence: 0.1, // Baja confianza en el fallback
    }
  }
}

/**
 * Procesa un mensaje de WhatsApp: transcribe audio si es necesario y analiza el texto
 * @param text Texto del mensaje (si es texto directo)
 * @param audioUrl URL del audio (si es nota de voz)
 * @param messageId ID del mensaje (para descargar audio encriptado)
 * @param remoteJid JID del remitente (para descargar audio encriptado)
 * @returns Datos de tarea procesados
 */
export async function processWhatsAppMessage(
  text?: string,
  audioUrl?: string,
  messageId?: string,
  remoteJid?: string
): Promise<ProcessedTaskData> {
  let finalText = text || ""

  // Si es audio, primero transcribir
  if (audioUrl) {
    finalText = await transcribeAudio(audioUrl, messageId, remoteJid)
  }

  if (!finalText.trim()) {
    throw new Error("No se pudo obtener texto del mensaje")
  }

  // Analizar el texto con GPT-4
  return await analyzeTaskText(finalText)
}
