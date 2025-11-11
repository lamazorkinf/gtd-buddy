# Configuración de WhatsApp para GTD Buddy

Esta guía te ayudará a configurar la integración de WhatsApp con GTD Buddy usando Evolution API.

## Requisitos Previos

1. **Cuenta de OpenAI** - Para transcripción de audio (Whisper) y análisis de IA (GPT-4)
2. **Evolution API** - Para la integración con WhatsApp
3. **Variables de entorno** configuradas en tu proyecto

## Paso 1: Configurar Evolution API

### Opción A: Usar Evolution API Cloud (Recomendado)

1. Visita [Evolution API](https://evolution-api.com/) y crea una cuenta
2. Crea una nueva instancia de WhatsApp
3. Escanea el código QR con tu WhatsApp para conectar la cuenta
4. Obtén tu:
   - `EVOLUTION_API_URL` (ej: https://api.evolution-api.com)
   - `EVOLUTION_API_KEY` (tu API key)
   - `EVOLUTION_INSTANCE_NAME` (nombre de tu instancia)

### Opción B: Auto-Hospedar Evolution API

1. Clona el repositorio de Evolution API:
   ```bash
   git clone https://github.com/EvolutionAPI/evolution-api.git
   cd evolution-api
   ```

2. Configura las variables de entorno según la documentación oficial

3. Inicia el servidor:
   ```bash
   docker-compose up -d
   ```

4. Conecta tu WhatsApp escaneando el código QR

## Paso 2: Configurar OpenAI

1. Visita [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a API Keys y genera una nueva clave
4. Copia tu `OPENAI_API_KEY`

## Paso 3: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y agrega:

```env
# WhatsApp Integration
EVOLUTION_API_URL=https://tu-servidor-evolution.com
EVOLUTION_API_KEY=tu_api_key_de_evolution
EVOLUTION_INSTANCE_NAME=tu_instancia

# OpenAI
OPENAI_API_KEY=sk-tu-api-key-de-openai
```

## Paso 4: Configurar Webhook en Evolution API

Una vez que tu aplicación esté desplegada, configura el webhook en Evolution API:

1. URL del webhook: `https://tu-dominio.com/api/whatsapp/webhook`
2. Eventos a escuchar:
   - `messages.upsert` (mensajes nuevos)
3. Incluye el header `apikey` con tu `EVOLUTION_API_KEY`

### Ejemplo de configuración de webhook:

```bash
curl -X POST https://tu-evolution-api.com/webhook/set \
  -H "apikey: tu_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-dominio.com/api/whatsapp/webhook",
    "webhook_by_events": true,
    "events": ["messages.upsert"]
  }'
```

## Paso 5: Vincular Cuenta de Usuario

1. Inicia sesión en GTD Buddy
2. Ve a **Mi Perfil** > **WhatsApp**
3. Ingresa tu número de WhatsApp (con código de país, ej: +54 9 11 1234-5678)
4. Haz clic en **Generar Código**
5. Recibirás un código de 6 dígitos
6. Envía ese código al número de WhatsApp del bot
7. Recibirás una confirmación cuando tu cuenta esté vinculada

## Uso

### Crear Tareas por Texto

Envía un mensaje de texto al bot, por ejemplo:

```
Llamar al dentista mañana a las 3pm
```

La IA analizará el mensaje y creará una tarea con:
- Título: "Llamar al dentista"
- Fecha: Mañana a las 15:00
- Categoría: Inbox (o sugerida por IA)

### Crear Tareas por Audio

Envía una nota de voz al bot describiendo tu tarea. El sistema:
1. Transcribirá el audio usando Whisper
2. Analizará el texto con GPT-4
3. Creará la tarea con los datos extraídos

### Especificar Contextos

Usa `@` seguido del nombre del contexto:

```
Comprar leche y pan @compras
```

La IA intentará asociar la tarea con el contexto "compras" si existe.

### Fechas Naturales

El sistema entiende fechas en lenguaje natural:

- "mañana"
- "próximo lunes"
- "en 3 días"
- "el 25 de diciembre"

## Ejemplos de Mensajes

### Ejemplo 1: Tarea Simple
```
Revisar email
```
→ Crea tarea en Inbox

### Ejemplo 2: Tarea con Fecha
```
Reunión con el equipo el próximo martes a las 10am
```
→ Crea tarea con fecha específica

### Ejemplo 3: Tarea con Contexto
```
Llamar a Juan para coordinar proyecto @llamadas
```
→ Crea tarea en contexto "llamadas"

### Ejemplo 4: Tarea Rápida (< 2 minutos)
```
Responder email de María
```
→ IA puede detectar que es una tarea rápida (isQuickAction)

## Categorías GTD

El sistema puede sugerir automáticamente categorías GTD:

- **Inbox**: Tareas sin procesar (por defecto para capturas rápidas)
- **Próximas acciones**: Acciones concretas que se pueden hacer ahora
- **Multitarea**: Proyectos que requieren múltiples pasos
- **A la espera**: Tareas que dependen de alguien más
- **Algún día**: Ideas o tareas para el futuro

## Solución de Problemas

### El bot no responde

1. Verifica que Evolution API esté funcionando
2. Comprueba que el webhook esté configurado correctamente
3. Revisa los logs del servidor Next.js

### Error de transcripción de audio

1. Verifica que `OPENAI_API_KEY` esté configurada
2. Asegúrate de tener créditos en tu cuenta de OpenAI
3. Comprueba que el formato de audio sea compatible

### Código de vinculación no funciona

1. Los códigos expiran después de 15 minutos
2. Genera un nuevo código si el anterior expiró
3. Asegúrate de enviar el código desde el número que registraste

### Tareas no se crean

1. Verifica que tu suscripción esté activa
2. Comprueba que tu cuenta de WhatsApp esté vinculada
3. Revisa los logs del servidor para errores

## Seguridad

- Los números de WhatsApp se almacenan encriptados en Firestore
- Los códigos de vinculación expiran después de 15 minutos
- Solo usuarios con suscripción activa pueden usar WhatsApp
- El webhook está protegido con API key

## Costos

### Evolution API
- Servicio cloud: Varía según el plan
- Auto-hospedado: Solo costos de servidor

### OpenAI
- Whisper API: ~$0.006 por minuto de audio
- GPT-4: ~$0.03 por 1K tokens de entrada, ~$0.06 por 1K tokens de salida
- Costo estimado por mensaje: $0.01 - $0.05 (dependiendo del tamaño)

## Soporte

Para problemas o preguntas, contacta al equipo de desarrollo o revisa la documentación en `CLAUDE.md`.
