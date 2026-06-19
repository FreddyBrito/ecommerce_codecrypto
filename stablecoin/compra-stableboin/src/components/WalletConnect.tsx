"use client";

interface WalletConnectProps {
  address: string | null;
  balance: string;
  isConnecting: boolean;
  isCorrectChain: boolean;
  chainId: number | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({
  address,
  balance,
  isConnecting,
  isCorrectChain,
  chainId,
  error,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  if (address) {
    return (
      <div className="flex items-center gap-3">
        {!isCorrectChain && (
          <span className="px-2 py-0.5 text-xs font-bold uppercase bg-error text-on-dark">
            Red incorrecta ({chainId})
          </span>
        )}
        <div className="flex items-center gap-2 border border-hairline px-3 py-2">
          <div className="w-2 h-2 bg-nvidia-green" />
          <span className="text-sm font-bold text-body">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <span className="text-xs text-muted">
            {Number(balance).toFixed(4)} ETH
          </span>
        </div>
        <button
          onClick={onDisconnect}
          className="px-4 py-2 text-sm font-bold text-muted border border-hairline
                     hover:text-ink hover:border-hairline-strong transition-colors"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-error">{error}</span>}
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="px-5 py-2.5 text-sm font-bold bg-nvidia-green text-ink
                   hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark
                   transition-colors"
      >
        {isConnecting ? "Conectando..." : "Conectar MetaMask"}
      </button>
    </div>
  );
}
