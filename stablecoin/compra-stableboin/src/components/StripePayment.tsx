"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { config } from "@/lib/config";

const stripePromise = config.stripePublishableKey
  ? loadStripe(config.stripePublishableKey)
  : null;

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({
  onSuccess,
  onError,
}: {
  onSuccess: (id: string) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Error al procesar pago");
      setIsProcessing(false);
    } else {
      onSuccess("payment_confirmed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 text-base font-bold bg-nvidia-green text-ink
                   hover:bg-nvidia-green-dark disabled:bg-surface-soft disabled:text-ash
                   transition-colors"
      >
        {isProcessing ? "Procesando..." : "Confirmar Pago"}
      </button>
    </form>
  );
}

export function StripePayment({
  clientSecret,
  onSuccess,
  onError,
}: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className="p-4 text-sm text-error border border-error">
        Stripe no esta configurado. Agrega tu publishable key en .env.local
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#76b900",
            borderRadius: "2px",
            fontFamily: "Inter, Arial, sans-serif",
          },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
