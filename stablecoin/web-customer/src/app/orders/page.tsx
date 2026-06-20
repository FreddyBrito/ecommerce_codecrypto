"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useEcommerce, type Invoice } from "@/hooks/useEcommerce";

export default function OrdersPage() {
  const wallet = useWallet();
  const { getCustomerInvoices } = useEcommerce();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!wallet.address || loadedRef.current) return;
    loadedRef.current = true;
    setLoadingInvoices(true);
    getCustomerInvoices(wallet.address)
      .then((inv) => {
        setInvoices(inv.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)));
        setLoadingInvoices(false);
      })
      .catch(() => setLoadingInvoices(false));
  }, [wallet.address, getCustomerInvoices]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Mis Facturas</h1>
          <p className="text-muted mt-2">
            Historial de tus compras
          </p>
        </div>

        {!wallet.address ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">Conecta tu wallet</h2>
            <button
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
            >
              {wallet.isConnecting ? "Conectando..." : "Conectar MetaMask"}
            </button>
          </div>
        ) : loadingInvoices ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-nvidia-green mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-muted">Cargando facturas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">No tienes facturas aun</h2>
            <p className="text-muted mb-6">
              Realiza tu primera compra para ver tus facturas aqui
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="border border-hairline bg-canvas">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="px-6 py-4 text-left text-xs text-muted uppercase font-bold">Factura</th>
                    <th className="px-6 py-4 text-left text-xs text-muted uppercase font-bold">Monto</th>
                    <th className="px-6 py-4 text-left text-xs text-muted uppercase font-bold">Estado</th>
                    <th className="px-6 py-4 text-left text-xs text-muted uppercase font-bold">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs text-muted uppercase font-bold">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={Number(inv.invoiceId)} className="border-b border-hairline last:border-0 hover:bg-surface-soft transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-ink">
                        #{Number(inv.invoiceId)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-nvidia-green">
                        {(Number(inv.totalAmount) / 1_000_000).toFixed(2)} EUR
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold ${inv.isPaid ? "bg-green-50 text-success" : "bg-yellow-50 text-warning"}`}>
                          {inv.isPaid ? "Pagada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {new Date(Number(inv.timestamp) * 1000).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted">
                        {inv.isPaid
                          ? `${inv.paymentTxHash.slice(0, 10)}...`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-surface-dark py-6 px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-nvidia-green" />
            <span className="text-on-dark-muted text-xs">Tienda EURT</span>
          </div>
          <span className="text-on-dark-muted text-xs">Powered by Ethereum</span>
        </div>
      </footer>
    </div>
  );
}
