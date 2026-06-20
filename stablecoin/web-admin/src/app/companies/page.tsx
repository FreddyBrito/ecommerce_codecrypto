"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useEcommerce, type Company } from "@/hooks/useEcommerce";
import { config } from "@/lib/config";

export default function CompaniesPage() {
  const wallet = useWallet();
  const { registerCompany, getCompanyByOwner, getCompany } = useEcommerce();
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!wallet.address || !config.ecommerceAddress || loadedRef.current) return;
    loadedRef.current = true;
    setLoadingCompany(true);
    getCompanyByOwner(wallet.address)
      .then((id) => {
        if (id > BigInt(0)) {
          return getCompany(Number(id));
        }
        return null;
      })
      .then((c) => {
        setCompany(c);
        setLoadingCompany(false);
      })
      .catch(() => setLoadingCompany(false));
  }, [wallet.address, getCompanyByOwner, getCompany]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.signer || !name || !taxId) return;

    setTxPending(true);
    setError(null);
    try {
      await registerCompany(wallet.signer, name, taxId);
      setSuccess(true);
      setShowForm(false);
      const id = await getCompanyByOwner(wallet.address!);
      if (id > BigInt(0)) {
        const c = await getCompany(Number(id));
        setCompany(c);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar empresa");
    } finally {
      setTxPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Empresas</h1>
          <p className="text-muted mt-2">
            Registra y gestiona tu empresa
          </p>
        </div>

        {!wallet.address ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">Conecta tu wallet</h2>
            <p className="text-muted mb-6">
              Conecta MetaMask para registrar tu empresa
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
        ) : loadingCompany ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted uppercase font-bold mb-1">Direccion</p>
                <p className="text-sm font-mono text-ink break-all">{company.companyAddress}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase font-bold mb-1">NIF/CIF</p>
                <p className="text-sm text-ink">{company.taxId}</p>
              </div>
            </div>
          </div>
        ) : showForm ? (
          <div className="border border-hairline bg-canvas p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-nvidia-green" />
              <h2 className="text-xl font-bold text-ink">Registrar Empresa</h2>
            </div>

            {success && (
              <div className="px-4 py-3 bg-green-50 border border-success text-sm text-success mb-6">
                Empresa registrada correctamente
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-error text-sm text-error mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi Tienda"
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">
                  NIF/CIF
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="ES12345678A"
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={txPending || !name || !taxId}
                  className="px-6 py-3 text-sm font-bold bg-nvidia-green text-ink
                             hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
                >
                  {txPending ? "Registrando..." : "Registrar Empresa"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-sm font-bold border border-hairline text-ink
                             hover:bg-surface-soft transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">No tienes empresa registrada</h2>
            <p className="text-muted mb-6">
              Registra tu empresa para comenzar a vender productos
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark transition-colors"
            >
              Registrar Empresa
            </button>
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
