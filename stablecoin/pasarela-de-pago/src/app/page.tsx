"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useEuroToken } from "@/hooks/useEuroToken";

type PaymentStep = "details" | "confirming" | "success" | "error";

function parsePaymentParams(searchParams: URLSearchParams) {
  const merchantAddress = searchParams.get("merchant_address");
  const amount = searchParams.get("amount");
  const invoice = searchParams.get("invoice");
  const date = searchParams.get("date");
  const redirect = searchParams.get("redirect");

  if (merchantAddress && amount && invoice) {
    return {
      merchantAddress,
      amount: parseFloat(amount),
      invoice,
      date: date || new Date().toISOString().split("T")[0],
      redirect: redirect || "",
    };
  }
  return null;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const euroToken = useEuroToken();

  const params = useMemo(() => parsePaymentParams(searchParams), [searchParams]);
  const [step, setStep] = useState<PaymentStep>(params ? "details" : "error");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    params ? null : "Parametros de pago incompletos en la URL"
  );

  useEffect(() => {
    if (wallet.address && params) {
      euroToken.fetchBalance(wallet.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, params]);

  const handlePay = useCallback(async () => {
    if (!wallet.signer || !wallet.address || !params) return;

    if (!euroToken.hasEnoughBalance(params.amount)) {
      setErrorMsg(`Saldo insuficiente. Tienes ${euroToken.balance} EURT, necesitas ${params.amount} EURT`);
      setStep("error");
      return;
    }

    setStep("confirming");

    try {
      const receipt = await euroToken.transfer(
        wallet.signer,
        params.merchantAddress,
        params.amount
      );
      setTxHash(receipt?.hash || null);
      setStep("success");

      if (params.redirect) {
        setTimeout(() => {
          window.location.href = params.redirect;
        }, 3000);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al procesar pago");
      setStep("error");
    }
  }, [wallet.signer, wallet.address, params, euroToken]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="bg-surface-dark">
        <div className="mx-auto max-w-2xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-nvidia-green" />
            <span className="text-on-dark text-sm font-bold uppercase tracking-wider">
              Pasarela de Pago
            </span>
          </div>
          {wallet.address ? (
            <div className="flex items-center gap-2 border border-hairline-strong px-3 py-1.5">
              <div className="w-2 h-2 bg-nvidia-green" />
              <span className="text-on-dark text-xs font-bold">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            </div>
          ) : (
            <button
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="px-4 py-2 text-xs font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
            >
              {wallet.isConnecting ? "Conectando..." : "Conectar MetaMask"}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {step === "details" && params && (
            <div className="border border-hairline bg-canvas p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-nvidia-green" />
                <h2 className="text-xl font-bold text-ink">Detalles del Pago</h2>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between py-2 border-b border-hairline">
                  <span className="text-sm text-muted">Comerciante</span>
                  <span className="text-sm font-bold text-ink font-mono">
                    {params.merchantAddress.slice(0, 10)}...{params.merchantAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-hairline">
                  <span className="text-sm text-muted">Monto</span>
                  <span className="text-2xl font-bold text-nvidia-green">
                    {params.amount.toFixed(2)} EURT
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-hairline">
                  <span className="text-sm text-muted">Factura</span>
                  <span className="text-sm font-bold text-ink">{params.invoice}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-hairline">
                  <span className="text-sm text-muted">Fecha</span>
                  <span className="text-sm text-ink">{params.date}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted">Tu balance</span>
                  <span className={`text-sm font-bold ${euroToken.hasEnoughBalance(params.amount) ? "text-ink" : "text-error"}`}>
                    {euroToken.balance} EURT
                  </span>
                </div>
              </div>

              {!wallet.address ? (
                <button
                  onClick={wallet.connect}
                  disabled={wallet.isConnecting}
                  className="w-full py-3 text-base font-bold bg-nvidia-green text-ink
                             hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
                >
                  {wallet.isConnecting ? "Conectando..." : "Conectar MetaMask para pagar"}
                </button>
              ) : !euroToken.hasEnoughBalance(params.amount) ? (
                <div className="flex flex-col gap-3">
                  <div className="px-4 py-3 bg-red-50 border border-error text-sm text-error">
                    Saldo insuficiente. Necesitas {params.amount.toFixed(2)} EURT.
                  </div>
                  <a
                    href="http://localhost:3000"
                    className="w-full py-3 text-base font-bold border border-nvidia-green text-nvidia-green
                               hover:bg-nvidia-green hover:text-ink transition-colors text-center"
                  >
                    Comprar EURT
                  </a>
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  className="w-full py-3 text-base font-bold bg-nvidia-green text-ink
                             hover:bg-nvidia-green-dark transition-colors"
                >
                  Pagar {params.amount.toFixed(2)} EURT
                </button>
              )}
            </div>
          )}

          {step === "confirming" && (
            <div className="border border-hairline bg-canvas p-8 text-center">
              <svg className="animate-spin h-12 w-12 text-nvidia-green mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h2 className="text-xl font-bold text-ink mb-2">Procesando pago...</h2>
              <p className="text-sm text-muted">Confirma la transaccion en MetaMask</p>
            </div>
          )}

          {step === "success" && (
            <div className="border border-hairline bg-canvas p-8 text-center">
              <div className="w-16 h-16 bg-success mx-auto mb-4 flex items-center justify-center">
                <svg className="h-8 w-8 text-on-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-ink mb-2">Pago exitoso</h2>
              <p className="text-sm text-muted mb-4">
                {params?.amount.toFixed(2)} EURT transferidos a {params?.merchantAddress.slice(0, 10)}...
              </p>
              {txHash && (
                <div className="px-4 py-3 bg-surface-soft border border-hairline mb-4">
                  <p className="text-xs text-muted mb-1">TX Hash</p>
                  <p className="text-xs font-mono text-body break-all">{txHash}</p>
                </div>
              )}
              {params?.redirect && (
                <p className="text-xs text-muted">Redirigiendo a la tienda en 3 segundos...</p>
              )}
            </div>
          )}

          {step === "error" && (
            <div className="border border-hairline bg-canvas p-8 text-center">
              <div className="w-16 h-16 bg-error mx-auto mb-4 flex items-center justify-center">
                <svg className="h-8 w-8 text-on-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-ink mb-2">Error en el pago</h2>
              <div className="px-4 py-3 bg-red-50 border border-error mb-4">
                <p className="text-sm text-error">{errorMsg}</p>
              </div>
              <button
                onClick={() => {
                  setStep("details");
                  setErrorMsg(null);
                }}
                className="w-full py-3 text-base font-bold border border-hairline text-ink
                           hover:bg-surface-soft transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-surface-dark py-6 px-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-nvidia-green" />
            <span className="text-on-dark-muted text-xs">Pasarela de Pago EURT</span>
          </div>
          <span className="text-on-dark-muted text-xs">Powered by Ethereum</span>
        </div>
      </footer>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-canvas">
          <svg className="animate-spin h-8 w-8 text-nvidia-green" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
