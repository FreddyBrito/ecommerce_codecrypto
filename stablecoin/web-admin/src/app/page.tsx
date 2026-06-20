"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useEcommerce, type Company } from "@/hooks/useEcommerce";
import { config } from "@/lib/config";

export default function DashboardPage() {
  const wallet = useWallet();
  const { getCompanyByOwner, getCompany } = useEcommerce();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!wallet.address || !config.ecommerceAddress || loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    getCompanyByOwner(wallet.address)
      .then((id) => {
        if (id > BigInt(0)) {
          return getCompany(Number(id));
        }
        return null;
      })
      .then((c) => {
        setCompany(c);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wallet.address, getCompanyByOwner, getCompany]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
          <p className="text-muted mt-2">
            Panel de administracion de empresas y productos
          </p>
        </div>

        {!config.ecommerceAddress ? (
          <div className="border border-hairline bg-canvas p-8">
            <h2 className="text-xl font-bold text-ink mb-4">Configuracion pendiente</h2>
            <p className="text-muted">
              Agrega la direccion del contrato Ecommerce en las variables de entorno:
            </p>
            <code className="block mt-4 p-4 bg-surface-soft border border-hairline text-sm font-mono">
              NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
            </code>
          </div>
        ) : !wallet.address ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">Conecta tu wallet</h2>
            <p className="text-muted mb-6">
              Conecta MetaMask para acceder al panel de administracion
            </p>
            <button
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
            >
              {wallet.isConnecting ? "Conectando..." : "Conectar MetaMask"}
            </button>
          </div>
        ) : loading ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-nvidia-green mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-muted">Cargando datos...</p>
          </div>
        ) : company ? (
          <div className="border border-hairline bg-canvas p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-nvidia-green" />
              <h2 className="text-xl font-bold text-ink">{company.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-muted uppercase font-bold mb-1">Direccion</p>
                <p className="text-sm font-mono text-ink break-all">{company.companyAddress}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase font-bold mb-1">NIF/CIF</p>
                <p className="text-sm text-ink">{company.taxId}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/company/${company.companyId}`}
                className="px-4 py-2 text-sm font-bold bg-nvidia-green text-ink
                           hover:bg-nvidia-green-dark transition-colors"
              >
                Gestionar
              </Link>
            </div>
          </div>
        ) : (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">No tienes empresa registrada</h2>
            <p className="text-muted mb-6">
              Registra tu empresa para comenzar a vender productos
            </p>
            <Link
              href="/companies"
              className="inline-block px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark transition-colors"
            >
              Registrar Empresa
            </Link>
          </div>
        )}
      </main>

      <footer className="bg-surface-dark py-6 px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-nvidia-green" />
            <span className="text-on-dark-muted text-xs">Admin Panel</span>
          </div>
          <span className="text-on-dark-muted text-xs">Powered by Ethereum</span>
        </div>
      </footer>
    </div>
  );
}
