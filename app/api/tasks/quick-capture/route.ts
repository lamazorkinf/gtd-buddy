import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin } from "@/lib/firebase-admin"

// POST - Captura rápida de tarea
export async function POST(request: NextRequest) {
  try {
    const { auth, db } = getFirebaseAdmin()

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { title, description } = body

    // Validación básica
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        {
          error: "El título de la tarea es requerido",
        },
        { status: 400 },
      )
    }

    // Datos para captura rápida - siempre va al Inbox
    const taskData = {
      title: title.trim(),
      description: description?.trim() || "",
      category: "Inbox", // Siempre va al inbox para procesamiento posterior
      priority: "media", // Prioridad por defecto
      completed: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      energyLevel: "media",
      isQuickAction: false,
      subtasks: [],
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
    }

    return NextResponse.json(
      {
        task,
        message: "Tarea capturada exitosamente en el Inbox",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error en captura rápida:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
