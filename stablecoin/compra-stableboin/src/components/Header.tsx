"use client";

import { WalletConnect } from "./WalletConnect";

interface HeaderProps {
  address: string | null;
  balance: string;
  isConnecting: boolean;
  isCorrectChain: boolean;
  chainId: number | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({
  address,
  balance,
  isConnecting,
  isCorrectChain,
  chainId,
  error,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  return (
    <header className="bg-surface-dark">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-nvidia-green" />
          <span className="text-on-dark text-sm font-bold uppercase tracking-wider">
            EuroToken
          </span>
          <span className="text-on-dark-muted text-xs">
            Compra de Stablecoins
          </span>
        </div>
        <WalletConnect
          address={address}
          balance={balance}
          isConnecting={isConnecting}
          isCorrectChain={isCorrectChain}
          chainId={chainId}
          error={error}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
}
