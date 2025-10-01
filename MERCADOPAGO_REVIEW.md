# Análisis del Flujo de Suscripciones MercadoPago - GTD Buddy

## Resumen Ejecutivo

El flujo de suscripciones implementado está **funcionalmente correcto** y sigue las mejores prácticas de MercadoPago. Se identificaron pequeñas mejoras que pueden optimizar la experiencia del usuario y la robustez del sistema.

---

## ✅ Aspectos Implementados Correctamente

### 1. Creación de Suscripción (`/api/create-subscription`)
- ✅ Verifica que el plan existe en MercadoPago antes de proceder
- ✅ Usa `external_reference` para vincular suscripciones con usuarios
- ✅ Configura correctamente las URLs de retorno (success, failure, pending)
- ✅ Incluye validación de variables de entorno
- ✅ Logging detallado para debugging

### 2. Webhooks (`/api/webhooks/mercadopago`)
- ✅ Validación de firma (signature) para seguridad
- ✅ Maneja todos los estados de suscripción:
  - `authorized` → activa suscripción
  - `pending` → pendiente de pago
  - `cancelled` → cancelada
  - `paused` → pausada
  - `suspended` → suspendida
- ✅ Actualiza Firestore correctamente
- ✅ Calcula fechas de expiración basadas en frecuencia de billing
- ✅ Maneja tanto notificaciones de `preapproval` como de `payment`

### 3. Verificación de Pagos (`/api/verify-payment`)
- ✅ Consulta estado en tiempo real desde MercadoPago
- ✅ Actualiza estado del usuario en Firestore
- ✅ Manejo de errores apropiado

---

## 🔍 Recomendaciones de Mejora

### 1. **Usar API de Preapproval en lugar de URL directa** (Prioridad: Alta)

**Problema actual:**
```typescript
const baseUrlCheckout = "https://www.mercadopago.com.ar/subscriptions/checkout";
const params = new URLSearchParams({ ... }).toString();
const checkoutUrl = `${baseUrlCheckout}?${params}`;
```

**Solución recomendada:**
Según la [documentación oficial de MercadoPago](https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post), deberías crear la suscripción mediante la API:

```typescript
const response = await fetch('https://api.mercadopago.com/preapproval', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reason: "Suscripción GTD Buddy - Plan Pro",
    preapproval_plan_id: planId,
    external_reference: userId,
    payer_email: email,
    back_url: `${baseUrlApp}/subscription/success`,
    status: "pending"
  })
});

const data = await response.json();
// data.init_point contiene la URL de checkout
```

**Beneficios:**
- Obtienes un `init_point` oficial de MercadoPago
- Mejor control sobre los parámetros de la suscripción
- Puedes obtener el `preapproval_id` inmediatamente
- Permite configurar campos adicionales como `status`, `card_token_id`, etc.

### 2. **Agregar campo `reason`** (Prioridad: Media) ✅ YA APLICADO

El campo `reason` es visible para el usuario durante el checkout y es considerado buena práctica:
```typescript
reason: "Suscripción GTD Buddy - Plan Pro"
```

### 3. **Mejorar manejo de estados en verify-payment** (Prioridad: Baja)

Actualmente mapeas estados, pero podrías agregar más contexto:

```typescript
// En verify-payment/route.ts, línea 70-85
const statusMessages = {
  authorized: "Suscripción activa y vigente",
  pending: "Pago pendiente de aprobación",
  cancelled: "Suscripción cancelada por el usuario",
  paused: "Suscripción pausada temporalmente",
  suspended: "Suscripción suspendida por falta de pago"
};
```

### 4. **Configurar Webhook en MercadoPago Dashboard** (Prioridad: Alta)

Asegúrate de configurar el webhook en tu panel de MercadoPago:

1. Ir a: https://www.mercadopago.com.ar/developers/panel/app
2. Seleccionar tu aplicación
3. Ir a "Webhooks" → "Configurar notificaciones"
4. Agregar URL: `https://tudominio.com/api/webhooks/mercadopago`
5. Seleccionar eventos:
   - ✅ `preapproval` (suscripciones)
   - ✅ `payment` (pagos individuales)
6. Guardar el **Secret** generado en `MP_WEBHOOK_SECRET`

### 5. **Agregar retry logic en webhooks** (Prioridad: Baja)

MercadoPago reintenta enviar webhooks si fallas, pero puedes agregar lógica de retry en verificación:

```typescript
// En verify-payment/route.ts
const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    const mpResponse = await fetch(...);
    if (mpResponse.ok) break;
  } catch (error) {
    if (i === MAX_RETRIES - 1) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
  }
}
```

---

## 📋 Variables de Entorno Necesarias

Verifica que tengas configuradas:

```env
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-xxxxx-xxxxx
MP_PLAN_ID=2c9380XXXX
MP_WEBHOOK_SECRET=xxxxx (generado en panel de MP)

# App
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

---

## 🔐 Seguridad

### Validación de Firma (Implementado correctamente ✅)

Tu implementación en `webhooks/mercadopago/route.ts` ya incluye validación de firma:

```typescript
function validateMercadoPagoSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get("x-signature")
  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
  return signature === `sha256=${expectedSignature}`
}
```

✅ **Esto es correcto según la documentación de MercadoPago**

---

## 🧪 Testing

### Simulador de Webhooks de MercadoPago

Usa el simulador oficial para probar tu webhook:
https://www.mercadopago.com.uy/developers/en/news/2024/01/11/Webhooks-Notifications-Simulator-and-Secret-Signature

### Estados de Suscripción a Probar

1. **authorized** → Usuario paga correctamente
2. **pending** → Pago pendiente (ej: transferencia bancaria)
3. **cancelled** → Usuario cancela suscripción
4. **paused** → Suscripción pausada
5. **suspended** → Falta de pago

---

## 📊 Flujo Completo

```mermaid
graph TD
    A[Usuario hace clic en Suscribirse] --> B[/api/create-subscription]
    B --> C{Plan existe?}
    C -->|No| D[Error 400]
    C -->|Sí| E[Generar URL de checkout]
    E --> F[Redirigir a MercadoPago]
    F --> G{Usuario completa pago?}
    G -->|Sí| H[MercadoPago envía webhook]
    G -->|No| I[Redirect a /subscription/failure]
    H --> J[/api/webhooks/mercadopago]
    J --> K[Validar firma]
    K -->|Inválida| L[401 Unauthorized]
    K -->|Válida| M[Actualizar Firestore]
    M --> N[Estado: active]
    G -->|Pendiente| O[Redirect a /subscription/pending]
    G -->|Éxito| P[Redirect a /subscription/success]
    P --> Q[/api/verify-payment]
    Q --> R[Verificar estado en MP]
    R --> S[Mostrar confirmación]
```

---

## ✨ Conclusión

Tu implementación actual es **sólida y funcional**. Las recomendaciones son optimizaciones menores que pueden mejorar:

1. 🎯 **Robustez**: Usar la API oficial en lugar de URL directa
2. 📱 **UX**: Agregar `reason` para mejor experiencia en checkout
3. 🔒 **Seguridad**: Ya implementada correctamente ✅
4. 🐛 **Debugging**: Logging detallado ya implementado ✅

**Prioridad de implementación:**
1. ⚠️ **Alta**: Configurar webhook en MercadoPago Dashboard
2. 🔄 **Media**: Migrar a API de preapproval (si tienes problemas con el flujo actual)
3. ✅ **Baja**: Mejoras cosméticas (ya funcionando correctamente)

---

## 📚 Referencias

- [MercadoPago Preapproval API](https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post)
- [Webhooks Documentation](https://www.mercadopago.com.uy/developers/en/docs/subscriptions/additional-content/your-integrations/notifications/webhooks)
- [Webhook Simulator](https://www.mercadopago.com.uy/developers/en/news/2024/01/11/Webhooks-Notifications-Simulator-and-Secret-Signature)
