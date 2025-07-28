# GTD Buddy MCP Server

Un servidor MCP (Model Context Protocol) para gestionar tareas siguiendo la metodología GTD (Getting Things Done).

Este servidor soporta dos modos de operación:
- **Stdio**: Para usar con Claude Desktop (comunicación por entrada/salida estándar)
- **SSE**: Para integración con aplicaciones web (Server-Sent Events sobre HTTP)

## Instalación

1. Navega al directorio del servidor MCP:
\`\`\`bash
cd mcp-server
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configura las variables de entorno:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Edita el archivo `.env` con tus credenciales de Firebase:
   - `FIREBASE_SERVICE_ACCOUNT`: JSON completo de la cuenta de servicio de Firebase
   - `FIREBASE_PROJECT_ID`: ID de tu proyecto de Firebase

## Configuración en Claude Desktop

1. Primero, compila el servidor:
\`\`\`bash
cd mcp-server
npm install
npm run build
\`\`\`

2. Obtén tu User ID de Firebase:
   - Inicia sesión en tu aplicación GTD Buddy
   - Abre las herramientas de desarrollo del navegador (F12)
   - Ve a la consola y ejecuta: `JSON.parse(localStorage.getItem('firebase:authUser:*')).uid`
   - Copia el ID que aparece

3. Agrega el servidor a tu configuración de Claude Desktop. 

En Windows, edita: `%APPDATA%\Claude\claude_desktop_config.json`

\`\`\`json
{
  "mcpServers": {
    "gtd-buddy": {
      "command": "node",
      "args": ["D:\\Proyectos\\gtd-buddy\\mcp-server\\run-mcp.js"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "{...tu JSON de service account en una sola línea...}",
        "FIREBASE_PROJECT_ID": "tu-project-id",
        "DEFAULT_USER_ID": "tu-user-id-de-firebase"
      }
    }
  }
}
\`\`\`

**Notas importantes**: 
- El JSON de `FIREBASE_SERVICE_ACCOUNT` debe estar en una sola línea, sin saltos de línea
- `DEFAULT_USER_ID` es el ID de tu usuario en Firebase (obtenido en el paso 2)

## Servidor SSE (Server-Sent Events)

El servidor SSE permite integrar el MCP con aplicaciones web mediante un endpoint HTTP.

### Configuración del servidor SSE

1. Configura las variables de entorno adicionales en tu `.env`:
\`\`\`bash
PORT=3001  # Puerto para el servidor SSE (por defecto 3001)
ALLOWED_ORIGINS=http://localhost:3000,https://tuapp.com  # Orígenes permitidos para CORS
\`\`\`

2. Compila el proyecto:
\`\`\`bash
npm run build
\`\`\`

3. Inicia el servidor SSE:
\`\`\`bash
npm run start:sse
# o para desarrollo:
npm run dev:sse
\`\`\`

### Endpoints disponibles

- `GET /health` - Endpoint de verificación de salud
- `GET /sse` - Endpoint SSE para conexión MCP

### Ejemplo de uso del endpoint SSE

\`\`\`javascript
// Conectar al servidor SSE
const eventSource = new EventSource('http://localhost:3001/sse');

// Enviar mensajes al servidor MCP
fetch('http://localhost:3001/sse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'list_tasks',
      arguments: {
        userId: 'tu-user-id'
      }
    },
    id: 1
  })
});

// Recibir respuestas
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Respuesta del MCP:', data);
};
\`\`\`

## Desarrollo

Para ejecutar en modo desarrollo:

**Servidor Stdio (Claude Desktop):**
\`\`\`bash
npm run dev
\`\`\`

**Servidor SSE (Web):**
\`\`\`bash
npm run dev:sse
\`\`\`

Para compilar ambos servidores:
\`\`\`bash
npm run build
\`\`\`

## Herramientas Disponibles

### `create_task`
Crea una nueva tarea GTD.

Parámetros:
- `title` (requerido): Título de la tarea
- `description`: Descripción de la tarea
- `userId` (requerido): ID del usuario
- `category`: Categoría GTD (inbox, nextActions, multiStep, waiting, someday)
- `priority`: Prioridad (baja, media, alta)
- `contextId`: ID del contexto
- `energyLevel`: Nivel de energía requerido (1-5)
- `dueDate`: Fecha de vencimiento (formato ISO)
- `isQuickAction`: ¿Es una tarea de 2 minutos?

### `list_tasks`
Lista tareas con filtros opcionales.

Parámetros:
- `userId` (requerido): ID del usuario
- `category`: Filtrar por categoría GTD
- `contextId`: Filtrar por contexto
- `completed`: Filtrar por estado de completado

### `update_task`
Actualiza una tarea existente.

Parámetros:
- `taskId` (requerido): ID de la tarea a actualizar
- Todos los demás parámetros de `create_task` son opcionales

### `delete_task`
Elimina una tarea.

Parámetros:
- `taskId` (requerido): ID de la tarea a eliminar

### `create_context`
Crea un nuevo contexto GTD.

Parámetros:
- `name` (requerido): Nombre del contexto
- `userId` (requerido): ID del usuario
- `color`: Color del contexto (formato hex)
- `icon`: Icono del contexto (emoji)

### `list_contexts`
Lista todos los contextos de un usuario.

Parámetros:
- `userId` (requerido): ID del usuario

## Ejemplo de Uso en Claude

Una vez configurado con tu `DEFAULT_USER_ID`, puedes usar comandos simples como:

\`\`\`
Crea una tarea llamada "Revisar emails" en la categoría "nextActions" con prioridad "alta"
\`\`\`

\`\`\`
Lista todas mis tareas pendientes
\`\`\`

\`\`\`
Crea un contexto llamado "Oficina" con el color #3B82F6
\`\`\`

Ya no necesitas especificar el userId en cada comando, el servidor usará automáticamente tu DEFAULT_USER_ID.
