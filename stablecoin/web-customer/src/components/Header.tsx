"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const wallet = useWallet();

  return (
    <header className="bg-surface-dark">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-3 h-3 bg-nvidia-green" />
            <span className="text-on-dark text-sm font-bold uppercase tracking-wider">
              Tienda
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-on-dark-muted text-sm hover:text-on-dark transition-colors">
              Productos
            </Link>
            <Link href="/cart" className="text-on-dark-muted text-sm hover:text-on-dark transition-colors relative">
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-4 w-5 h-5 bg-nvidia-green text-ink text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/orders" className="text-on-dark-muted text-sm hover:text-on-dark transition-colors">
              Mis Facturas
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
