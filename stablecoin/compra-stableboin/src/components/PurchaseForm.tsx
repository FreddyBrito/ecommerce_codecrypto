"use client";

import { useState } from "react";

interface PurchaseFormProps {
  isWalletConnected: boolean;
  isCorrectChain: boolean;
  balance: string;
  onSubmit: (amount: number) => Promise<void>;
  isProcessing: boolean;
}

export function PurchaseForm({
  isWalletConnected,
  isCorrectChain,
  balance,
  onSubmit,
  isProcessing,
}: PurchaseFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount > 0 && parsedAmount <= 10000;
  const canSubmit = isValid && isWalletConnected && isCorrectChain && !isProcessing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    try {
      await onSubmit(parsedAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar pago");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Monto en EUR
        </label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max="10000"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={!isWalletConnected || !isCorrectChain}
            className="w-full border border-hairline px-4 py-3 text-lg font-bold text-ink
                       bg-canvas placeholder:text-ash
                       focus:outline-none focus:border-2 focus:border-nvidia-green
                       disabled:bg-surface-soft disabled:text-ash
                       transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
            EUR
          </span>
        </div>
      </div>

      {isWalletConnected && isCorrectChain && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Tu balance: {Number(balance).toFixed(2)} EURT</span>
          <span>Monto maximo: 10,000 EUR</span>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 text-sm text-error bg-red-50 border border-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 text-base font-bold bg-nvidia-green text-ink
                   hover:bg-nvidia-green-dark disabled:bg-surface-soft disabled:text-ash
                   transition-colors"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Procesando pago...
          </span>
        ) : (
          `Comprar ${parsedAmount > 0 ? parsedAmount.toFixed(2) : ""} EURT`
        )}
      </button>

      {!isWalletConnected && (
        <p className="text-xs text-center text-muted">
          Conecta tu wallet para continuar
        </p>
      )}
      {isWalletConnected && !isCorrectChain && (
        <p className="text-xs text-center text-error">
          Cambia a la red correcta en MetaMask (chainId 31337)
        </p>
      )}
    </form>
  );
}
