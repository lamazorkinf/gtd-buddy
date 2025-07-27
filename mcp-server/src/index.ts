import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeFirebase, db } from './firebase.js';
import { 
  Task, 
  Context, 
  GTDCategory, 
  Priority
} from './types.js';

// Initialize Firebase
initializeFirebase();

// Define available tools
const tools: Tool[] = [
  {
    name: 'create_task',
    description: 'Create a new GTD task',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        userId: { type: 'string', description: 'User ID who owns the task' },
        category: { 
          type: 'string', 
          enum: ['inbox', 'nextActions', 'multiStep', 'waiting', 'someday'],
          description: 'GTD category (defaults to inbox)' 
        },
        priority: { 
          type: 'string', 
          enum: ['baja', 'media', 'alta'],
          description: 'Task priority (defaults to media)' 
        },
        contextId: { type: 'string', description: 'Context ID for the task' },
        energyLevel: { 
          type: 'number', 
          minimum: 1, 
          maximum: 5,
          description: 'Energy level required (1-5)' 
        },
        dueDate: { type: 'string', description: 'Due date in ISO format' },
        isQuickAction: { type: 'boolean', description: 'Is this a 2-minute task?' },
      },
      required: ['title', 'userId'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to filter tasks' },
        category: { 
          type: 'string', 
          enum: ['inbox', 'nextActions', 'multiStep', 'waiting', 'someday'],
          description: 'Filter by GTD category' 
        },
        contextId: { type: 'string', description: 'Filter by context' },
        completed: { type: 'boolean', description: 'Filter by completion status' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to update' },
        title: { type: 'string', description: 'New task title' },
        description: { type: 'string', description: 'New task description' },
        category: { 
          type: 'string', 
          enum: ['inbox', 'nextActions', 'multiStep', 'waiting', 'someday'],
          description: 'New GTD category' 
        },
        priority: { 
          type: 'string', 
          enum: ['baja', 'media', 'alta'],
          description: 'New priority' 
        },
        contextId: { type: 'string', description: 'New context ID' },
        energyLevel: { 
          type: 'number', 
          minimum: 1, 
          maximum: 5,
          description: 'New energy level' 
        },
        dueDate: { type: 'string', description: 'New due date in ISO format' },
        completed: { type: 'boolean', description: 'Mark as completed/uncompleted' },
        isQuickAction: { type: 'boolean', description: 'Update quick action status' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to delete' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_context',
    description: 'Create a new GTD context',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Context name' },
        userId: { type: 'string', description: 'User ID who owns the context' },
        color: { type: 'string', description: 'Context color (hex format)' },
        icon: { type: 'string', description: 'Context icon (emoji)' },
      },
      required: ['name', 'userId'],
    },
  },
  {
    name: 'list_contexts',
    description: 'List all contexts for a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to list contexts for' },
      },
      required: ['userId'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'gtd-buddy-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('No arguments provided');
  }

  try {
    switch (name) {
      case 'create_task': {
        const taskData: Partial<Task> = {
          title: args.title as string,
          description: (args.description as string) || '',
          userId: args.userId as string,
          category: (args.category as GTDCategory) || 'inbox',
          priority: (args.priority as Priority) || 'media',
          contextId: args.contextId as string | undefined,
          energyLevel: (args.energyLevel as number) || 3,
          dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
          completed: false,
          isQuickAction: (args.isQuickAction as boolean) || false,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await db.collection('tasks').add(taskData);
        const newTask = { id: docRef.id, ...taskData };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, task: newTask }, null, 2),
            },
          ],
        };
      }

      case 'list_tasks': {
        let query = db.collection('tasks')
          .where('userId', '==', args.userId as string);

        if (args.category) {
          query = query.where('category', '==', args.category as string);
        }
        if (args.contextId) {
          query = query.where('contextId', '==', args.contextId as string);
        }
        if (args.completed !== undefined) {
          query = query.where('completed', '==', args.completed as boolean);
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, tasks }, null, 2),
            },
          ],
        };
      }

      case 'update_task': {
        const taskId = args.taskId as string;
        const { taskId: _, ...updates } = args;
        
        const updateData: any = { ...updates, updatedAt: new Date() };
        if (updates.dueDate) {
          updateData.dueDate = new Date(updates.dueDate as string);
        }

        await db.collection('tasks').doc(taskId).update(updateData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, taskId, updates }, null, 2),
            },
          ],
        };
      }

      case 'delete_task': {
        await db.collection('tasks').doc(args.taskId as string).delete();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, taskId: args.taskId }, null, 2),
            },
          ],
        };
      }

      case 'create_context': {
        const contextData: Partial<Context> = {
          name: args.name as string,
          userId: args.userId as string,
          color: (args.color as string) || '#3B82F6',
          icon: (args.icon as string) || '📁',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await db.collection('contexts').add(contextData);
        const newContext = { id: docRef.id, ...contextData };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, context: newContext }, null, 2),
            },
          ],
        };
      }

      case 'list_contexts': {
        const snapshot = await db.collection('contexts')
          .where('userId', '==', args.userId as string)
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, contexts }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            error: true, 
            message: error instanceof Error ? error.message : 'Unknown error' 
          }, null, 2),
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GTD Buddy MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});