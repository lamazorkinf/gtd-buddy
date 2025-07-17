import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
  initializeApp({
    credential: cert(serviceAccount),
  })
}

const db = getFirestore()
const auth = getAuth()

// GET - Listar tareas del usuario
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const contextId = searchParams.get("contextId")
    const completed = searchParams.get("completed")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Construir consulta base
    let query = db.collection("tasks").where("userId", "==", userId)

    // Aplicar filtros opcionales
    if (category) {
      query = query.where("category", "==", category)
    }
    if (contextId) {
      query = query.where("contextId", "==", contextId)
    }
    if (completed !== null) {
      query = query.where("completed", "==", completed === "true")
    }

    // Ordenar y limitar
    query = query.orderBy("createdAt", "desc").limit(limit)

    const snapshot = await query.get()
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
      dueDate: doc.data().dueDate?.toDate()?.toISOString() || null,
      lastReviewed: doc.data().lastReviewed?.toDate()?.toISOString() || null,
    }))

    return NextResponse.json({ tasks, count: tasks.length })
  } catch (error) {
    console.error("Error al obtener tareas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { title, description, category, priority, dueDate, contextId, energyLevel, estimatedMinutes, isQuickAction } =
      body

    // Validaciones básicas
    if (!title || !category || !priority) {
      return NextResponse.json(
        {
          error: "Campos requeridos: title, category, priority",
        },
        { status: 400 },
      )
    }

    // Preparar datos de la tarea
    const taskData: any = {
      title: title.trim(),
      description: description?.trim() || "",
      category,
      priority,
      completed: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      energyLevel: energyLevel || "media",
      isQuickAction: isQuickAction || false,
      subtasks: [],
    }

    // Campos opcionales
    if (dueDate) {
      taskData.dueDate = new Date(dueDate)
    }
    if (contextId) {
      taskData.contextId = contextId
    }
    if (estimatedMinutes) {
      taskData.estimatedMinutes = Number.parseInt(estimatedMinutes)
    }

    // Crear la tarea en Firestore
    const docRef = await db.collection("tasks").add(taskData)

    // Obtener la tarea creada
    const createdTask = await docRef.get()
    const task = {
      id: createdTask.id,
      ...createdTask.data(),
      createdAt: createdTask.data()?.createdAt?.toDate()?.toISOString(),
      updatedAt: createdTask.data()?.updatedAt?.toDate()?.toISOString(),
      dueDate: createdTask.data()?.dueDate?.toDate()?.toISOString() || null,
    }

    return NextResponse.json({ task, message: "Tarea creada exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error al crear tarea:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
