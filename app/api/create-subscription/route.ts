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

    // 3) Crear suscripción usando la API oficial de MercadoPago
    //    Según la documentación oficial:
    //    https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
    console.log("📡 Creando preapproval en MercadoPago...");

    const preapprovalPayload = {
      reason: "Suscripción GTD Buddy - Plan Pro",
      preapproval_plan_id: planId,
      external_reference: userId,
      payer_email: email,
      back_url: `${baseUrlApp}/subscription/success`,
      status: "pending", // Estado inicial
    };

    console.log("📦 Payload de preapproval:", JSON.stringify(preapprovalPayload, null, 2));

    const createPreapprovalResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalPayload),
    });

    if (!createPreapprovalResponse.ok) {
      const errorText = await createPreapprovalResponse.text();
      console.error("❌ Error al crear preapproval:", createPreapprovalResponse.status, errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        {
          error: "Error al crear suscripción en MercadoPago",
          details: errorData.message || errorData.error || "Error desconocido",
          status: createPreapprovalResponse.status
        },
        { status: createPreapprovalResponse.status }
      );
    }

    const preapprovalData = await createPreapprovalResponse.json();
    console.log("✅ Preapproval creado exitosamente:", preapprovalData.id);
    console.log("🔗 Init point:", preapprovalData.init_point);

    // 4) Devolver JSON con init_point oficial de MercadoPago
    return NextResponse.json(
      {
        id: preapprovalData.id,
        status: preapprovalData.status,
        init_point: preapprovalData.init_point,
        success: true,
        preapproval_id: preapprovalData.id,
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
