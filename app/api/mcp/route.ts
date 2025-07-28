import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { 
  Task, 
  Context, 
  GTDCategory, 
  Priority
} from '@/types/task';

// Initialize Firebase Admin if not initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
  initializeApp({
    credential: cert(serviceAccount),
  })
}

const adminDb = getFirestore();
const adminAuth = getAuth();

// Verify authentication
async function verifyAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, params } = body;

    // Handle different MCP actions
    switch (action) {
      case 'create_task': {
        const taskData: Partial<Task> = {
          title: params.title as string,
          description: (params.description as string) || '',
          userId,
          category: (params.category as GTDCategory) || 'inbox',
          priority: (params.priority as Priority) || 'media',
          contextId: params.contextId as string | undefined,
          energyLevel: (params.energyLevel as number) || 3,
          dueDate: params.dueDate ? new Date(params.dueDate as string) : null,
          completed: false,
          isQuickAction: (params.isQuickAction as boolean) || false,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await adminDb.collection('tasks').add(taskData);
        const newTask = { id: docRef.id, ...taskData };

        return NextResponse.json({ success: true, task: newTask });
      }

      case 'list_tasks': {
        let query = adminDb.collection('tasks')
          .where('userId', '==', userId);

        if (params.category) {
          query = query.where('category', '==', params.category as string);
        }
        if (params.contextId) {
          query = query.where('contextId', '==', params.contextId as string);
        }
        if (params.completed !== undefined) {
          query = query.where('completed', '==', params.completed as boolean);
        }

        const snapshot = await query.get();
        const tasks: Task[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasks.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            dueDate: data.dueDate?.toDate() || null,
          } as Task);
        });

        return NextResponse.json({ success: true, tasks });
      }

      case 'update_task': {
        const taskId = params.taskId as string;
        const { taskId: _, ...updates } = params;
        
        // Verify task belongs to user
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
          return NextResponse.json(
            { error: 'Task not found or unauthorized' },
            { status: 404 }
          );
        }
        
        const updateData: any = { ...updates, updatedAt: new Date() };
        if (updates.dueDate) {
          updateData.dueDate = new Date(updates.dueDate as string);
        }

        await adminDb.collection('tasks').doc(taskId).update(updateData);

        return NextResponse.json({ success: true, taskId, updates });
      }

      case 'delete_task': {
        const taskId = params.taskId as string;
        
        // Verify task belongs to user
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
          return NextResponse.json(
            { error: 'Task not found or unauthorized' },
            { status: 404 }
          );
        }
        
        await adminDb.collection('tasks').doc(taskId).delete();

        return NextResponse.json({ success: true, taskId });
      }

      case 'create_context': {
        const contextData: Partial<Context> = {
          name: params.name as string,
          userId,
          color: (params.color as string) || '#3B82F6',
          icon: (params.icon as string) || '📁',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await adminDb.collection('contexts').add(contextData);
        const newContext = { id: docRef.id, ...contextData };

        return NextResponse.json({ success: true, context: newContext });
      }

      case 'list_contexts': {
        const snapshot = await adminDb.collection('contexts')
          .where('userId', '==', userId)
          .get();

        const contexts: Context[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          contexts.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Context);
        });

        return NextResponse.json({ success: true, contexts });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for listing available actions
export async function GET() {
  const actions = [
    {
      name: 'create_task',
      description: 'Create a new GTD task',
      params: ['title', 'description?', 'category?', 'priority?', 'contextId?', 'energyLevel?', 'dueDate?', 'isQuickAction?']
    },
    {
      name: 'list_tasks',
      description: 'List tasks with optional filters',
      params: ['category?', 'contextId?', 'completed?']
    },
    {
      name: 'update_task',
      description: 'Update an existing task',
      params: ['taskId', 'title?', 'description?', 'category?', 'priority?', 'contextId?', 'energyLevel?', 'dueDate?', 'completed?', 'isQuickAction?']
    },
    {
      name: 'delete_task',
      description: 'Delete a task',
      params: ['taskId']
    },
    {
      name: 'create_context',
      description: 'Create a new GTD context',
      params: ['name', 'color?', 'icon?']
    },
    {
      name: 'list_contexts',
      description: 'List all contexts for a user',
      params: []
    }
  ];

  return NextResponse.json({ actions });
}