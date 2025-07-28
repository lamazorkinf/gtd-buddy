/**
 * Ejemplo de cliente para usar el MCP API en https://gtdbuddy.vercel.app/
 * 
 * Este ejemplo muestra cómo interactuar con el endpoint /api/mcp
 * desde una aplicación externa o desde la consola del navegador.
 */

class GTDBuddyMCPClient {
  constructor(baseUrl = 'https://gtdbuddy.vercel.app', firebaseToken = null) {
    this.baseUrl = baseUrl;
    this.token = firebaseToken;
  }

  // Establecer el token de autenticación de Firebase
  setToken(token) {
    this.token = token;
  }

  // Hacer una petición al API MCP
  async request(action, params = {}) {
    if (!this.token) {
      throw new Error('Token de autenticación requerido. Usa setToken() primero.');
    }

    const response = await fetch(`${this.baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        action,
        params
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error ${response.status}: ${error.error}`);
    }

    return await response.json();
  }

  // Obtener acciones disponibles
  async getActions() {
    const response = await fetch(`${this.baseUrl}/api/mcp`);
    return await response.json();
  }

  // Métodos de conveniencia para cada acción MCP

  async createTask(title, options = {}) {
    return this.request('create_task', {
      title,
      ...options
    });
  }

  async listTasks(filters = {}) {
    return this.request('list_tasks', filters);
  }

  async updateTask(taskId, updates) {
    return this.request('update_task', {
      taskId,
      ...updates
    });
  }

  async deleteTask(taskId) {
    return this.request('delete_task', { taskId });
  }

  async createContext(name, options = {}) {
    return this.request('create_context', {
      name,
      ...options
    });
  }

  async listContexts() {
    return this.request('list_contexts');
  }
}

// Ejemplo de uso desde la consola del navegador en gtdbuddy.vercel.app
async function ejemploDeUso() {
  // 1. Crear cliente
  const client = new GTDBuddyMCPClient();

  // 2. Obtener token desde Firebase (si estás en la aplicación)
  if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
    const token = await firebase.auth().currentUser.getIdToken();
    client.setToken(token);
  } else {
    console.log('Necesitas autenticarte primero o proporcionar un token manualmente');
    return;
  }

  try {
    // 3. Crear una tarea
    console.log('Creando tarea...');
    const newTask = await client.createTask('Tarea de prueba desde MCP', {
      description: 'Esta tarea fue creada usando el API MCP',
      category: 'inbox',
      priority: 'media'
    });
    console.log('Tarea creada:', newTask);

    // 4. Listar tareas en inbox
    console.log('Listando tareas en inbox...');
    const inboxTasks = await client.listTasks({ 
      category: 'inbox',
      completed: false 
    });
    console.log('Tareas en inbox:', inboxTasks);

    // 5. Crear un contexto
    console.log('Creando contexto...');
    const newContext = await client.createContext('API Testing', {
      color: '#FF6B6B',
      icon: '🧪'
    });
    console.log('Contexto creado:', newContext);

    // 6. Listar contextos
    console.log('Listando contextos...');
    const contexts = await client.listContexts();
    console.log('Contextos:', contexts);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Para usar desde Node.js (necesitas instalar 'node-fetch')
async function ejemploNodeJS() {
  // const fetch = require('node-fetch'); // Descomenta si usas Node.js < 18
  
  const response = await fetch('https://gtdbuddy.vercel.app/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TU_FIREBASE_TOKEN_AQUI'
    },
    body: JSON.stringify({
      action: 'list_tasks',
      params: {
        category: 'nextActions'
      }
    })
  });

  const data = await response.json();
  console.log(data);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GTDBuddyMCPClient;
}

// Hacer disponible globalmente en el navegador
if (typeof window !== 'undefined') {
  window.GTDBuddyMCPClient = GTDBuddyMCPClient;
  window.ejemploDeUso = ejemploDeUso;
}

console.log(`
🚀 GTD Buddy MCP Client cargado!

Para usar desde la consola del navegador en gtdbuddy.vercel.app:
1. Asegúrate de estar autenticado
2. Ejecuta: ejemploDeUso()

Para crear un cliente:
const client = new GTDBuddyMCPClient();
const token = await firebase.auth().currentUser.getIdToken();
client.setToken(token);

Luego puedes usar métodos como:
- client.createTask('Mi tarea')
- client.listTasks()
- client.createContext('Mi contexto')
`);