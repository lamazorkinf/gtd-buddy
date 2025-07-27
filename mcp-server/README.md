# GTD Buddy MCP Server

Un servidor MCP (Model Context Protocol) para gestionar tareas siguiendo la metodología GTD (Getting Things Done).

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
```bash
cd mcp-server
npm install
npm run build
```

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

## Desarrollo

Para ejecutar en modo desarrollo:
\`\`\`bash
npm run dev
\`\`\`

Para compilar:
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
