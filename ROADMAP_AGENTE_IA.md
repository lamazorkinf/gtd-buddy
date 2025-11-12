# 🤖 Roadmap: De Bot Conversacional a Agente de IA

## 📊 Estado Actual vs Estado Objetivo

### Bot Conversacional Actual
- ✅ Detecta intenciones (intent detection)
- ✅ Responde a comandos específicos
- ✅ Contexto conversacional básico (últimos 5 mensajes)
- ✅ Categorización automática GTD
- ✅ Procesamiento de texto y audio
- ❌ No toma decisiones autónomas
- ❌ No puede usar múltiples herramientas en secuencia
- ❌ No tiene memoria a largo plazo
- ❌ No planifica acciones multi-paso

### Agente de IA (Objetivo)
- ✅ **Autonomía**: Toma decisiones sin intervención manual
- ✅ **Razonamiento**: Usa patrón ReAct (Reasoning + Acting)
- ✅ **Herramientas múltiples**: Accede a Firestore, calendarios, APIs externas
- ✅ **Memoria persistente**: RAG + Vector DB para recordar interacciones
- ✅ **Planificación multi-paso**: Descompone tareas complejas
- ✅ **Proactividad**: Envía recordatorios y sugerencias automáticas

---

## 🎯 Diferencias Clave: Bot vs Agente

### Arquitectura Actual
```
Usuario → Intent Detection → Acción Directa → Respuesta
```

### Arquitectura ReAct Propuesta
```
Usuario → Agente ReAct → [Think → Act → Observe] loop → Respuesta
```

### Ejemplo Práctico

**Entrada del usuario:**
```
"Recuérdame comprar pan mañana a las 8am y agrégalo a mi lista de compras"
```

**Bot actual:**
- Detecta intent: `create_task`
- Crea tarea simple
- Responde: "✅ Tarea creada"

**Agente propuesto:**
```
THINK: "Necesito crear una tarea Y agregarla a un contexto existente"
ACT 1: Buscar contexto "@Compras"
OBSERVE: "Contexto encontrado: id=abc123"
ACT 2: Crear tarea con dueDate y contextId
OBSERVE: "Tarea creada: id=xyz789"
ACT 3: Confirmar con usuario
FINAL: "✅ Agregué 'Comprar pan' a @Compras para mañana 8am"
```

---

## 🛠️ Componentes a Implementar

### 1. Sistema de Herramientas (Tool Calling)

Convertir funciones actuales en "tools" que el agente puede invocar dinámicamente:

```typescript
// lib/agent-tools.ts
export const agentTools = [
  {
    name: "create_task",
    description: "Crea una nueva tarea en Firestore",
    parameters: {
      title: "string",
      dueDate: "Date | null",
      category: "GTD category",
      contextId: "string | null"
    }
  },
  {
    name: "search_tasks",
    description: "Busca tareas existentes por filtros",
    parameters: {
      filter: "inbox | today | all",
      contextName: "string | null"
    }
  },
  {
    name: "update_task",
    description: "Actualiza campos de una tarea",
    parameters: {
      taskId: "string",
      updates: "Partial<Task>"
    }
  },
  {
    name: "get_contexts",
    description: "Lista todos los contextos del usuario",
    parameters: {}
  },
  {
    name: "analyze_weekly_productivity",
    description: "Genera reporte de productividad semanal",
    parameters: {
      startDate: "Date",
      endDate: "Date"
    }
  },
  {
    name: "suggest_next_action",
    description: "Sugiere próxima acción basada en prioridades y contexto actual",
    parameters: {
      currentContext: "string | null",
      availableTime: "number (minutos)"
    }
  }
]
```

**Beneficios:**
- El agente decide qué herramientas usar
- Puede encadenar múltiples herramientas
- Más flexible que switch/case estático

---

### 2. Memoria Persistente con RAG (Retrieval-Augmented Generation)

**Problema actual:** Solo guardamos últimos 5 mensajes

**Solución propuesta:** Vector database con embeddings

```typescript
// lib/agent-memory.ts
import { OpenAIEmbeddings } from "@langchain/openai"
import { PineconeStore } from "@langchain/pinecone"

// Guardar interacciones importantes con embeddings
export async function storeMemory(
  userId: string,
  interaction: {
    type: "task_created" | "goal_mentioned" | "preference_stated"
    content: string
    timestamp: Date
    metadata: any
  }
) {
  const embeddings = new OpenAIEmbeddings()
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    indexName: "gtd-buddy-memory"
  })

  await vectorStore.addDocuments([{
    pageContent: interaction.content,
    metadata: {
      userId,
      type: interaction.type,
      timestamp: interaction.timestamp,
      ...interaction.metadata
    }
  }])
}

// Recuperar memoria relevante
export async function retrieveRelevantMemory(
  userId: string,
  query: string,
  limit: number = 5
) {
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { indexName: "gtd-buddy-memory" }
  )

  return await vectorStore.similaritySearch(query, limit, {
    userId
  })
}
```

**Caso de uso:**
```
Usuario (hace 2 semanas): "Me encanta leer los domingos por la tarde"
Usuario (hoy): "Recomiéndame algo para hacer"
Agente: "Basándome en que te gusta leer los domingos, ¿qué tal revisar tu lista de libros en @Algún día?"
```

**Ventajas:**
- Memoria a largo plazo (no solo últimos 5 mensajes)
- Búsqueda semántica de interacciones pasadas
- Personalización basada en preferencias históricas
- Entendimiento de patrones del usuario

---

### 3. Proactividad con Cron Jobs

**Funcionalidad:** El agente envía mensajes sin que el usuario lo solicite

```typescript
// app/api/agent/proactive-checks/route.ts
export async function GET() {
  const users = await getActiveUsers()

  for (const user of users) {
    // Analizar tareas pendientes
    const overdueTasks = await getOverdueTasks(user.id)
    const todayTasks = await getTodayTasks(user.id)

    // Generar sugerencias inteligentes
    const suggestions = await generateProactiveSuggestions(user, {
      overdueTasks,
      todayTasks,
      userPreferences: await retrieveRelevantMemory(user.id, "preferences"),
      currentTime: new Date()
    })

    // Enviar mensaje proactivo
    if (suggestions.shouldNotify) {
      await sendWhatsAppMessage(
        user.whatsappNumber,
        suggestions.message
      )
    }
  }
}
```

**Ejemplos de mensajes proactivos:**
- "☀️ Buenos días! Tienes 3 tareas para hoy. ¿Empezamos con 'Llamar al dentista'?"
- "⚠️ La tarea 'Enviar informe' vence en 2 horas"
- "💡 Noté que tienes 30 minutos libres. ¿Qué tal completar algunas tareas rápidas?"
- "📊 Resumen semanal: Completaste 12 tareas. ¡Bien hecho!"

**Configuración en Vercel:**
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/agent/proactive-checks",
      "schedule": "0 8 * * *" // Todos los días a las 8am
    },
    {
      "path": "/api/agent/proactive-checks",
      "schedule": "0 20 * * *" // Todos los días a las 8pm
    }
  ]
}
```

---

### 4. Planificación Multi-Paso

**Funcionalidad:** Descomponer tareas complejas en pasos ejecutables

```typescript
// lib/agent-planner.ts
export async function planComplexTask(userMessage: string, userId: string) {
  const systemPrompt = `
Eres un agente planificador. Descompón tareas complejas en pasos ejecutables.

Usuario dice: "${userMessage}"

Analiza y genera un plan:
1. Identifica la meta principal
2. Descompón en subtareas
3. Determina dependencias
4. Asigna prioridades
5. Sugiere contextos GTD apropiados

Responde en JSON:
{
  "mainGoal": "string",
  "steps": [
    {
      "order": 1,
      "action": "string",
      "tool": "create_task | search_tasks | ...",
      "parameters": {},
      "dependsOn": []
    }
  ],
  "estimatedTime": "number (minutos)",
  "category": "Multitarea | Próximas acciones | ..."
}
`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" }
  })

  return JSON.parse(response.choices[0].message.content)
}
```

**Ejemplo:**
```
Usuario: "Quiero organizar una fiesta de cumpleaños para mi hija el próximo mes"

Agente:
"📋 He creado un plan para organizar la fiesta:

1. [Multitarea] Organizar fiesta cumpleaños
   - Definir lista de invitados
   - Reservar lugar
   - Contratar catering
   - Comprar decoraciones
   - Enviar invitaciones

¿Quieres que cree estas subtareas ahora?"
```

---

### 5. Arquitectura ReAct con LangGraph

**Framework recomendado:** LangGraph (state management para agentes)

```typescript
// lib/agent-graph.ts
import { StateGraph } from "@langchain/langgraph"
import { ChatOpenAI } from "@langchain/openai"

interface AgentState {
  messages: Message[]
  userId: string
  currentTask?: string
  tools: Tool[]
  memory: Memory[]
}

export function createReActAgent() {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0
  })

  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: [],
      userId: "",
      currentTask: undefined,
      tools: [],
      memory: []
    }
  })

  // Nodo: Razonamiento
  workflow.addNode("think", async (state) => {
    const relevantMemory = await retrieveRelevantMemory(
      state.userId,
      state.messages[state.messages.length - 1].content
    )

    const response = await model.invoke([
      ...state.messages,
      { role: "system", content: `Memoria relevante: ${relevantMemory}` }
    ])

    return {
      ...state,
      messages: [...state.messages, response]
    }
  })

  // Nodo: Acción (ejecutar herramienta)
  workflow.addNode("act", async (state) => {
    const lastMessage = state.messages[state.messages.length - 1]

    if (lastMessage.tool_calls) {
      const results = await executeTools(lastMessage.tool_calls)
      return {
        ...state,
        messages: [...state.messages, { role: "tool", content: results }]
      }
    }

    return state
  })

  // Nodo: Decidir siguiente paso
  workflow.addNode("decide", (state) => {
    const lastMessage = state.messages[state.messages.length - 1]

    if (lastMessage.role === "tool") {
      return "think" // Volver a razonar con nuevos datos
    } else if (lastMessage.tool_calls) {
      return "act" // Ejecutar herramientas
    } else {
      return "end" // Finalizar
    }
  })

  workflow.setEntryPoint("think")
  workflow.addEdge("think", "decide")
  workflow.addEdge("act", "decide")

  return workflow.compile()
}
```

**Ventajas de LangGraph:**
- Manejo de estado persistente entre pasos
- Visualización del flujo del agente (debugging)
- Paralelización de tool calls
- Retry logic y error handling automático
- Checkpointing para reanudar conversaciones

---

## 🚀 Roadmap de Implementación

### Fase 1: Fundamentos del Agente (2-3 semanas)
**Objetivo:** Migrar de switch/case a arquitectura de herramientas

1. **Refactorizar código actual en tools**
   - Crear `lib/agent-tools.ts`
   - Convertir cada case del switch en una herramienta
   - Definir schemas de parámetros

2. **Implementar OpenAI Function Calling**
   - Migrar de `detectUserIntent()` a function calling nativo
   - Agregar validación de parámetros
   - Manejo de errores en tool execution

3. **Loop ReAct básico**
   - Implementar ciclo Think → Act → Observe
   - Permitir múltiples tool calls en una conversación
   - Logging detallado para debugging

**Entregable:** Bot que puede ejecutar múltiples herramientas en secuencia

---

### Fase 2: Memoria y Contexto (2-3 semanas)
**Objetivo:** Agregar memoria a largo plazo

4. **Setup de Vector Database**
   - Elegir entre Pinecone / Supabase pgvector / Weaviate
   - Configurar índices y colecciones
   - Implementar pipeline de embeddings

5. **Sistema RAG**
   - Función `storeMemory()` para guardar interacciones
   - Función `retrieveRelevantMemory()` para búsqueda semántica
   - Integrar memoria en prompts del agente

6. **Análisis de patrones**
   - Detectar preferencias del usuario (horarios, contextos favoritos)
   - Identificar tareas recurrentes
   - Guardar feedback positivo/negativo

**Entregable:** Agente que recuerda conversaciones pasadas y personaliza respuestas

---

### Fase 3: Autonomía y Proactividad (2-3 semanas)
**Objetivo:** Agente que actúa sin ser solicitado

7. **Cron Jobs para mensajes proactivos**
   - Endpoint `/api/agent/proactive-checks`
   - Análisis de tareas vencidas/próximas
   - Configurar horarios óptimos de notificación

8. **Sistema de recomendaciones**
   - Sugerir próximas acciones basadas en contexto
   - Identificar tareas bloqueadas
   - Proponer reorganización de tareas

9. **Planificación multi-paso**
   - Implementar `planComplexTask()`
   - Descomposición automática de proyectos grandes
   - Creación de subtareas con dependencias

**Entregable:** Agente proactivo que ayuda sin ser preguntado

---

### Fase 4: Optimización y Aprendizaje (continuo)
**Objetivo:** Mejorar el agente con datos reales

10. **Fine-tuning del modelo**
    - Recolectar interacciones exitosas/fallidas
    - Crear dataset de entrenamiento
    - Fine-tune de GPT-4o con casos específicos

11. **A/B Testing de prompts**
    - Experimentar con diferentes system prompts
    - Medir satisfacción del usuario
    - Optimizar basado en métricas

12. **Analytics y métricas**
    - Dashboard de uso del agente
    - Tasa de éxito por herramienta
    - NPS y feedback cualitativo

**Entregable:** Agente que mejora continuamente

---

## 💡 Stack Tecnológico Recomendado

### Core del Agente
- **LangGraph** - Orquestación de agentes con estado
- **LangChain** - Abstracciones para LLMs y herramientas
- **OpenAI GPT-4o** - Razonamiento + function calling

### Memoria y Datos
- **Pinecone / Supabase pgvector** - Vector database para RAG
- **OpenAI Embeddings** - text-embedding-3-small
- **Firestore** - Base de datos existente (mantener)

### Infraestructura
- **Vercel** - Hosting y Cron Jobs
- **Evolution API** - WhatsApp Business API (mantener)
- **Sentry** - Monitoreo de errores

### Analytics
- **Posthog / Mixpanel** - Product analytics
- **LangSmith** - Tracing y debugging de LLMs

---

## 📊 Métricas de Éxito

### Fase 1: Fundamentos
- ✅ 100% de intents migrados a herramientas
- ✅ Tiempo de respuesta < 3 segundos
- ✅ 0 errores en tool execution

### Fase 2: Memoria
- ✅ Recall de conversaciones pasadas > 80%
- ✅ Personalización percibida por usuario
- ✅ Reducción de preguntas repetidas

### Fase 3: Proactividad
- ✅ 30% de usuarios reciben mensajes proactivos útiles
- ✅ Tasa de respuesta a notificaciones > 50%
- ✅ NPS > 8/10

### Fase 4: Optimización
- ✅ Mejora continua de métricas
- ✅ Reducción de latencia en 20%
- ✅ Aumento de engagement mensual

---

## 🎯 Recomendación: ¿Por Dónde Empezar?

**Prioridad 1: Fase 1 - Sistema de Herramientas**

Razones:
1. Menor complejidad técnica (no requiere infra nueva)
2. Mayor impacto: desbloquea multi-step reasoning
3. Reutiliza código existente (solo refactorización)
4. Base necesaria para Fases 2 y 3

**Quick Win:** Empezar con 3 herramientas básicas
- `create_task`
- `search_tasks`
- `update_task`

Luego expandir gradualmente a herramientas más complejas.

---

## 📚 Referencias y Recursos

### Documentación Técnica
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [ReAct Paper (2023)](https://arxiv.org/abs/2210.03629)

### Tutoriales Recomendados
- [Building ReAct Agents with LangGraph](https://dylancastillo.co/posts/react-agent-langgraph.html)
- [AI Agent vs Chatbot Differences](https://www.salesforce.com/agentforce/ai-agent-vs-chatbot/)

### Inspiración
- [WhatsApp AI Agents 2025 Best Practices](https://www.inoru.com/blog/build-conversational-ai-agents-on-whatsapp/)
- [Conversational AI Design Trends](https://www.botpress.com/blog/conversation-design)

---

## 🔮 Visión a Largo Plazo (6-12 meses)

### Características Avanzadas
- **Multi-modal AI**: Enviar/recibir imágenes, documentos, ubicaciones
- **Voice Input/Output**: Mensajes de voz bidireccionales
- **Integración con Calendar**: Bloquear tiempo para tareas automáticamente
- **Team Collaboration**: Agente que coordina tareas entre miembros del equipo
- **Auto-Learning**: Agente que mejora automáticamente sin intervención

### Escalabilidad
- Soportar 10,000+ usuarios concurrentes
- Latencia promedio < 1 segundo
- 99.9% uptime
- Multi-idioma (español, inglés, portugués)

---

**Última actualización:** 11 de noviembre de 2025
**Versión:** 1.0
**Autor:** Equipo GTD Buddy + Claude
