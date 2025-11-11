import OpenAI from "openai"
import type { ProcessedTaskData } from "@/types/whatsapp"
import type { GTDCategory } from "@/types/task"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Transcribe un archivo de audio usando Whisper API
 * @param audioUrl URL del archivo de audio
 * @returns Texto transcrito
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Descargar el audio
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Error descargando audio: ${response.statusText}`)
    }

    const audioBlob = await response.blob()
    const audioFile = new File([audioBlob], "audio.ogg", { type: "audio/ogg" })

    // Transcribir con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es", // Español
    })

    return transcription.text
  } catch (error) {
    console.error("Error transcribiendo audio:", error)
    throw new Error("No se pudo transcribir el audio")
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
 * @returns Datos de tarea procesados
 */
export async function processWhatsAppMessage(
  text?: string,
  audioUrl?: string
): Promise<ProcessedTaskData> {
  let finalText = text || ""

  // Si es audio, primero transcribir
  if (audioUrl) {
    finalText = await transcribeAudio(audioUrl)
  }

  if (!finalText.trim()) {
    throw new Error("No se pudo obtener texto del mensaje")
  }

  // Analizar el texto con GPT-4
  return await analyzeTaskText(finalText)
}
