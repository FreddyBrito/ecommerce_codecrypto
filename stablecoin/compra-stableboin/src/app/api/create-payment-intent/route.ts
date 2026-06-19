import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { amount, walletAddress } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto invalido" }, { status: 400 });
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Direccion de wallet requerida" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      metadata: {
        walletAddress,
        tokenAmount: amount.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    return NextResponse.json(
      { error: "Error al crear intencion de pago" },
      { status: 500 }
    );
  }
}
