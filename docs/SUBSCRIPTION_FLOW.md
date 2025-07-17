# Flujo de Suscripción - GTD Buddy

## Resumen del Sistema

GTD Buddy utiliza MercadoPago para manejar suscripciones mensuales de $2.500 ARS/mes, con un período de prueba gratuito de 7 días para nuevos usuarios.

## Estados de Suscripción

### Estados Principales
- `trial` - Período de prueba (7 días)
- `active` - Suscripción activa y pagada
- `pending_payment` - Pago pendiente de verificación
- `cancelled` - Suscripción cancelada por el usuario
- `paused` - Suscripción pausada
- `suspended` - Suscripción suspendida por falta de pago
- `test` - Usuario de prueba (acceso ilimitado)

### Campos Importantes en Usuario
```typescript
{
  subscriptionStatus: "trial" | "active" | "pending_payment" | "cancelled" | "paused" | "suspended" | "test"
  subscriptionEndDate: Date // Fecha de expiración
  trialStartDate: Date // Cuándo empezó el período de prueba
  mercadoPagoSubscriptionId: string // ID de suscripción en MP
  lastPaymentDate: Date // Último pago exitoso
  cancellationDate: Date // Fecha de cancelación
}
```

## Flujo de Período de Prueba

### 1. Usuario Nuevo se Registra
- Al registrarse, automáticamente obtiene `subscriptionStatus: "trial"`
- Se establece `trialStartDate: now()` y `subscriptionEndDate: now() + 7 días`
- Obtiene acceso completo por 7 días

### 2. Activación Manual de Trial
- Endpoint: `POST /api/start-trial`
- Solo funciona si el usuario nunca tuvo un trial
- Verificaciones:
  - Usuario existe
  - No tiene `trialStartDate` previo
  - No tiene `subscriptionStatus === "trial"`
  - No tiene suscripción activa

### 3. Expiración del Trial
- Cuando `subscriptionEndDate < now()` y `subscriptionStatus === "trial"`
- El usuario pierde acceso al dashboard
- Debe suscribirse para continuar

## Flujo de Suscripción con MercadoPago

### 1. Crear Suscripción
- Endpoint: `POST /api/create-subscription`
- Parámetros: `{ userId, email }`
- Validaciones:
  - Variables de entorno configuradas (`MP_ACCESS_TOKEN`, `MP_PLAN_ID`)
  - Plan existe en MercadoPago
  - Usuario válido
- Retorna: URL de checkout de MercadoPago

### 2. Proceso de Pago
- Usuario redirigido a MercadoPago
- URLs configuradas:
  - `success_url`: `/subscription/success`
  - `failure_url`: `/subscription/failure` 
  - `pending_url`: `/subscription/pending`

### 3. Verificación de Pago
- Endpoint: `POST /api/verify-payment`
- Webhooks: `POST /api/webhooks/mercadopago`
- Actualiza estado del usuario según respuesta de MP

### 4. Estados Post-Pago
- `authorized` → `subscriptionStatus: "active"`
- `pending` → `subscriptionStatus: "pending_payment"`
- `cancelled` → `subscriptionStatus: "cancelled"`

## Páginas del Flujo

### Core Pages
- `/subscription` - Página principal de suscripción
- `/subscription/success` - Pago exitoso
- `/subscription/failure` - Pago fallido
- `/subscription/pending` - Pago pendiente (con verificación automática)

### Management Pages
- `/subscription/cancel` - Cancelar suscripción
- `/subscription/cancelled` - Confirmación de cancelación

## APIs Disponibles

### Gestión de Suscripciones
- `POST /api/create-subscription` - Crear nueva suscripción
- `POST /api/verify-payment` - Verificar estado de pago
- `POST /api/cancel-subscription` - Cancelar suscripción
- `POST /api/start-trial` - Iniciar período de prueba

### Webhooks
- `POST /api/webhooks/mercadopago` - Recibir notificaciones de MP

## Variables de Entorno Requeridas

```env
# MercadoPago
MP_ACCESS_TOKEN=your_mercadopago_access_token
MP_PLAN_ID=your_mercadopago_plan_id

# Application
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# Firebase (ver .env.example para lista completa)
```

## Verificación de Acceso

La función `checkSubscriptionStatus()` en `/lib/subscription-utils.ts` determina si un usuario puede acceder al dashboard:

```typescript
// Usuarios test siempre tienen acceso
if (user.role === "test") return { canAccessDashboard: true }

// Verificar si suscripción no ha expirado
if (user.subscriptionEndDate > now()) {
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trial") {
    return { canAccessDashboard: true }
  }
}
```

## Flujo de Cancelación

1. Usuario va a `/subscription/cancel`
2. Confirma cancelación
3. API llama a MercadoPago para cancelar
4. Actualiza estado local a `cancelled`
5. Usuario mantiene acceso hasta `subscriptionEndDate`
6. Redirige a `/subscription/cancelled`

## Mejores Prácticas

### Seguridad
- Validar firma de webhooks de MercadoPago (implementado pero deshabilitado en desarrollo)
- Nunca confiar solo en el frontend para verificar suscripciones
- Siempre verificar con MercadoPago en operaciones críticas

### UX
- Mostrar claramente cuándo expira el trial/suscripción
- Permitir fácil reactivación de suscripciones canceladas
- Manejar estados pendientes con verificación automática

### Monitoreo
- Logs detallados en todas las operaciones de pago
- Tracking de estados de suscripción para analytics
- Alertas para fallos de webhook