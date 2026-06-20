"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

export function Header() {
  const wallet = useWallet();

  return (
    <header className="bg-surface-dark">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-3 h-3 bg-nvidia-green" />
            <span className="text-on-dark text-sm font-bold uppercase tracking-wider">
              Admin Panel
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/companies" className="text-on-dark-muted text-sm hover:text-on-dark transition-colors">
              Empresas
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {wallet.address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-hairline-strong px-3 py-1.5">
                <div className="w-2 h-2 bg-nvidia-green" />
                <span className="text-on-dark text-xs font-bold">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </div>
              {!wallet.isCorrectChain && (
                <span className="text-warning text-xs font-bold">Red incorrecta</span>
              )}
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
      </div>
    </header>
  );
}
