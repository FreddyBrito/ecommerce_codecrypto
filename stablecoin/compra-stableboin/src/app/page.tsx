"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { PurchaseForm } from "@/components/PurchaseForm";
import { StripePayment } from "@/components/StripePayment";
import { useWallet } from "@/hooks/useWallet";
import { useEuroToken } from "@/hooks/useEuroToken";

type Step = "form" | "payment" | "minting" | "success" | "error";

interface PurchaseState {
  step: Step;
  clientSecret: string | null;
  paymentIntentId: string | null;
  amount: number;
  txHash: string | null;
  errorMessage: string | null;
}

export default function EuroTokenPurchase() {
  const wallet = useWallet();
  const euroToken = useEuroToken();

  const [purchase, setPurchase] = useState<PurchaseState>({
    step: "form",
    clientSecret: null,
    paymentIntentId: null,
    amount: 0,
    txHash: null,
    errorMessage: null,
  });

  useEffect(() => {
    if (wallet.address) {
      euroToken.fetchBalance(wallet.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  const handlePurchase = useCallback(async (amount: number) => {
    if (!wallet.address) throw new Error("Wallet no conectada");

    setPurchase((s) => ({ ...s, step: "form", amount }));

    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, walletAddress: wallet.address }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setPurchase((s) => ({
      ...s,
      step: "payment",
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      amount,
    }));
  }, [wallet.address]);

  const handlePaymentSuccess = useCallback(
    async (paymentIntentId: string) => {
      setPurchase((s) => ({ ...s, step: "minting" }));

      try {
        const res = await fetch("/api/mint-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: wallet.address,
            amount: purchase.amount,
            paymentIntentId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setPurchase((s) => ({
          ...s,
          step: "success",
          txHash: data.txHash,
        }));

        if (wallet.address) {
          euroToken.fetchBalance(wallet.address);
        }
      } catch (err) {
        setPurchase((s) => ({
          ...s,
          step: "error",
          errorMessage: err instanceof Error ? err.message : "Error al mintear tokens",
        }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wallet.address, purchase.amount]
  );

  const handlePaymentError = useCallback((error: string) => {
    setPurchase((s) => ({ ...s, step: "error", errorMessage: error }));
  }, []);

  const resetPurchase = useCallback(() => {
    setPurchase({
      step: "form",
      clientSecret: null,
      paymentIntentId: null,
      amount: 0,
      txHash: null,
      errorMessage: null,
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header
        address={wallet.address}
        balance={euroToken.balance}
        isConnecting={wallet.isConnecting}
        isCorrectChain={wallet.isCorrectChain}
        chainId={wallet.chainId}
        error={wallet.error}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />

      <main className="flex-1">
        <section className="bg-surface-dark py-16 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="w-3 h-3 bg-nvidia-green mb-4" />
            <h1 className="text-on-dark text-4xl font-bold mb-3">
              Compra EuroTokens
            </h1>
            <p className="text-on-dark-muted text-lg max-w-xl">
              Adquiere stablecoins EURT (1 EURT = 1 EUR) usando tu tarjeta de
              credito. Los tokens se acreditan instantaneamente en tu wallet.
            </p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="border border-hairline bg-canvas p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-nvidia-green" />
                  <h2 className="text-xl font-bold text-ink">
                    {purchase.step === "form" && "Seleccionar monto"}
                    {purchase.step === "payment" && "Pago con tarjeta"}
                    {purchase.step === "minting" && "Acunando tokens..."}
                    {purchase.step === "success" && "Pago exitoso"}
                    {purchase.step === "error" && "Error en el pago"}
                  </h2>
                </div>

                {purchase.step === "form" && (
                  <PurchaseForm
                    isWalletConnected={!!wallet.address}
                    isCorrectChain={wallet.isCorrectChain}
                    balance={euroToken.balance}
                    onSubmit={handlePurchase}
                    isProcessing={false}
                  />
                )}

                {purchase.step === "payment" && purchase.clientSecret && (
                  <div className="flex flex-col gap-4">
                    <div className="px-4 py-3 bg-surface-soft border border-hairline">
                      <p className="text-sm text-body">
                        Monto a pagar:{" "}
                        <span className="font-bold">
                          {purchase.amount.toFixed(2)} EUR
                        </span>
                      </p>
                    </div>
                    <StripePayment
                      clientSecret={purchase.clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                    <button
                      onClick={resetPurchase}
                      className="text-sm text-muted hover:text-ink transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {purchase.step === "minting" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <svg
                      className="animate-spin h-10 w-10 text-nvidia-green"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <p className="text-sm text-muted">
                      Confirmando pago y acuando tokens...
                    </p>
                  </div>
                )}

                {purchase.step === "success" && (
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-2 text-success">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-bold">
                        {purchase.amount.toFixed(2)} EURT acreditados
                      </span>
                    </div>
                    {purchase.txHash && (
                      <div className="px-4 py-3 bg-surface-soft border border-hairline">
                        <p className="text-xs text-muted mb-1">TX Hash</p>
                        <p className="text-xs font-mono text-body break-all">
                          {purchase.txHash}
                        </p>
                      </div>
                    )}
                    <div className="px-4 py-3 bg-surface-soft border border-hairline">
                      <p className="text-xs text-muted mb-1">Balance actual</p>
                      <p className="text-lg font-bold text-ink">
                        {euroToken.balance} EURT
                      </p>
                    </div>
                    <button
                      onClick={resetPurchase}
                      className="w-full py-3 text-base font-bold bg-nvidia-green text-ink
                                 hover:bg-nvidia-green-dark transition-colors"
                    >
                      Comprar mas tokens
                    </button>
                  </div>
                )}

                {purchase.step === "error" && (
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-2 text-error">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="font-bold">Error en el pago</span>
                    </div>
                    <div className="px-4 py-3 bg-red-50 border border-error">
                      <p className="text-sm text-error">
                        {purchase.errorMessage}
                      </p>
                    </div>
                    <button
                      onClick={resetPurchase}
                      className="w-full py-3 text-base font-bold border border-hairline text-ink
                                 hover:bg-surface-soft transition-colors"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="border border-hairline bg-canvas p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">
                  Resumen
                </h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Token</span>
                    <span className="font-bold text-ink">EuroToken (EURT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Decimales</span>
                    <span className="font-bold text-ink">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Red</span>
                    <span className="font-bold text-ink">
                      Chain {wallet.chainId || "—"}
                    </span>
                  </div>
                  <div className="h-px bg-hairline" />
                  <div className="flex justify-between">
                    <span className="text-muted">Tu balance</span>
                    <span className="font-bold text-ink">
                      {euroToken.balance} EURT
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-hairline bg-canvas p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">
                  Como funciona
                </h3>
                <ol className="flex flex-col gap-3 text-sm text-body">
                  <li className="flex gap-3">
                    <span className="font-bold text-nvidia-green">01</span>
                    <span>Conecta tu wallet MetaMask</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-nvidia-green">02</span>
                    <span>Ingresa el monto en EUR</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-nvidia-green">03</span>
                    <span>Paga con tarjeta de credito via Stripe</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-nvidia-green">04</span>
                    <span>Recibe EURT instantaneamente en tu wallet</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-dark py-8 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-nvidia-green" />
            <span className="text-on-dark-muted text-xs">
              EuroToken Purchase Portal
            </span>
          </div>
          <span className="text-on-dark-muted text-xs">
            Powered by Stripe + Ethereum
          </span>
        </div>
      </footer>
    </div>
  );
}
