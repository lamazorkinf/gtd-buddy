// app/api/create-subscription/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🚀 Iniciando creación de suscripción...");
  try {
    // 1) Leer variables de entorno
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const planId = process.env.MP_PLAN_ID;
    const baseUrlApp = process.env.NEXT_PUBLIC_APP_URL;

    if (!accessToken || !planId || !baseUrlApp) {
      console.error("❌ Variables de entorno faltantes:", {
        MP_ACCESS_TOKEN: !!accessToken,
        MP_PLAN_ID: !!planId,
        NEXT_PUBLIC_APP_URL: !!baseUrlApp,
      });
      return NextResponse.json(
        { error: "Configuración de Mercado Pago incompleta" },
        { status: 500 }
      );
    }
    console.log("🔑 Variables configuradas correctamente");
    console.log("📋 Plan ID:", planId);

    // 1.5) Verificar que el plan existe en MercadoPago
    try {
      const planResponse = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!planResponse.ok) {
        console.error("❌ Plan no encontrado en MercadoPago:", planResponse.status);
        return NextResponse.json(
          { error: "Plan de suscripción no válido" },
          { status: 400 }
        );
      }

      const planData = await planResponse.json();
      console.log("✅ Plan verificado:", planData.reason || planData.id);
    } catch (planError) {
      console.error("❌ Error verificando plan:", planError);
      return NextResponse.json(
        { error: "Error verificando plan de suscripción" },
        { status: 500 }
      );
    }

    // 2) Leer y parsear el body
    let body: { userId?: string; email?: string };
    try {
      body = await request.json();
      console.log("📝 Body recibido:", body);
    } catch (err) {
      console.log("❌ Error al parsear JSON:", err);
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const { userId, email } = body;
    if (!userId || !email) {
      console.log("❌ Faltan parámetros userId o email");
      return NextResponse.json(
        { error: "userId y email son requeridos" },
        { status: 400 }
      );
    }

    // 3) Construir la URL de Checkout de suscripción
    //    Ya tienes tu plan en MP, así que basta con redirigir a:
    //      https://www.mercadopago.com.ar/subscriptions/checkout
    //      pasándole preapproval_plan_id=<planId>, external_reference=<userId>,
    //      payer_email=<email> y back_url=<...>/subscription/success
    const baseUrlCheckout =
      "https://www.mercadopago.com.ar/subscriptions/checkout";

    const params = new URLSearchParams({
      preapproval_plan_id: planId,
      external_reference: userId,
      payer_email: email,
      back_url: `${baseUrlApp}/subscription/success`,
      failure_url: `${baseUrlApp}/subscription/failure`,
      pending_url: `${baseUrlApp}/subscription/pending`,
    }).toString();

    const checkoutUrl = `${baseUrlCheckout}?${params}`;
    console.log("🔗 URL de checkout generada:", checkoutUrl);

    // 4) Devolver JSON con init_point
    return NextResponse.json(
      {
        id: `plan_${planId}_${Date.now()}`,
        status: "pending",
        init_point: checkoutUrl,
        success: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Error en create-subscription:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 });
}
