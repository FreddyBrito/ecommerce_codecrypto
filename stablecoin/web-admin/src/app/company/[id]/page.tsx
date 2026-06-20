"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { JsonRpcSigner } from "ethers";
import { Header } from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useEcommerce, type Company, type Product, type Invoice } from "@/hooks/useEcommerce";

type Tab = "products" | "invoices";

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = Number(params.id);
  const wallet = useWallet();
  const { getCompany, getCompanyProducts, addProduct, updateProduct, getCompanyInvoices } = useEcommerce();

  const [tab, setTab] = useState<Tab>("products");
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const loadedRef = useRef(false);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const c = await getCompany(companyId);
      setCompany(c);
      const [p, inv] = await Promise.all([
        getCompanyProducts(companyId),
        getCompanyInvoices(companyId),
      ]);
      setProducts(p);
      setInvoices(inv);
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  }, [companyId, getCompany, getCompanyProducts, getCompanyInvoices]);

  useEffect(() => {
    if (companyId && !loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [companyId, loadData]);

  const isOwner = wallet.address && company && wallet.address.toLowerCase() === company.companyAddress.toLowerCase();

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        {loadingData ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-nvidia-green mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-muted">Cargando empresa...</p>
          </div>
        ) : !company ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">Empresa no encontrada</h2>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-nvidia-green" />
                <h1 className="text-3xl font-bold text-ink">{company.name}</h1>
              </div>
              <p className="text-muted text-sm font-mono">{company.companyAddress}</p>
            </div>

            <div className="flex gap-1 border-b border-hairline mb-8">
              <button
                onClick={() => setTab("products")}
                className={`px-6 py-3 text-sm font-bold transition-colors ${
                  tab === "products"
                    ? "bg-ink text-on-dark"
                    : "text-muted hover:text-ink"
                }`}
              >
                Productos ({products.length})
              </button>
              <button
                onClick={() => setTab("invoices")}
                className={`px-6 py-3 text-sm font-bold transition-colors ${
                  tab === "invoices"
                    ? "bg-ink text-on-dark"
                    : "text-muted hover:text-ink"
                }`}
              >
                Facturas ({invoices.length})
              </button>
            </div>

            {tab === "products" ? (
              <ProductsTab
                products={products}
                companyId={companyId}
                isOwner={!!isOwner}
                onRefresh={loadData}
                addProduct={addProduct}
                updateProduct={updateProduct}
                walletSigner={wallet.signer}
              />
            ) : (
              <InvoicesTab invoices={invoices} />
            )}
          </>
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

function ProductsTab({
  products,
  companyId,
  isOwner,
  onRefresh,
  addProduct,
  updateProduct,
  walletSigner,
}: {
  products: Product[];
  companyId: number;
  isOwner: boolean;
  onRefresh: () => void;
  addProduct: (signer: JsonRpcSigner, companyId: number, name: string, description: string, price: number, stock: number, ipfsImageHash: string) => Promise<unknown>;
  updateProduct: (signer: JsonRpcSigner, productId: number, price: number, stock: number) => Promise<unknown>;
  walletSigner: JsonRpcSigner | null;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletSigner) return;
    setTxPending(true);
    setError(null);
    try {
      await addProduct(walletSigner, companyId, formName, formDesc, parseFloat(formPrice), parseInt(formStock), "");
      setShowAddForm(false);
      setFormName("");
      setFormDesc("");
      setFormPrice("");
      setFormStock("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setTxPending(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletSigner || editingId === null) return;
    setTxPending(true);
    setError(null);
    try {
      await updateProduct(walletSigner, editingId, parseFloat(formPrice), parseInt(formStock));
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setTxPending(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(Number(p.productId));
    setFormPrice(String(Number(p.price) / 1_000_000));
    setFormStock(String(Number(p.stock)));
    setShowAddForm(false);
  };

  return (
    <div>
      {isOwner && (
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="px-4 py-2 text-sm font-bold bg-nvidia-green text-ink
                       hover:bg-nvidia-green-dark transition-colors"
          >
            Agregar Producto
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-error text-sm text-error mb-4">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="border border-hairline bg-canvas p-6 mb-6">
          <h3 className="text-lg font-bold text-ink mb-4">Nuevo Producto</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">Descripcion</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">Precio (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">Stock</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={txPending}
                className="px-4 py-2 text-sm font-bold bg-nvidia-green text-ink
                           hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
              >
                {txPending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-bold border border-hairline text-ink
                           hover:bg-surface-soft transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 ? (
        <div className="border border-hairline bg-canvas p-8 text-center">
          <p className="text-muted">No hay productos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={Number(p.productId)} className="border border-hairline bg-canvas p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-bold text-ink">{p.name}</h3>
                <span className={`px-2 py-1 text-xs font-bold ${p.isActive ? "bg-green-50 text-success" : "bg-red-50 text-error"}`}>
                  {p.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              {p.description && (
                <p className="text-sm text-muted mb-3">{p.description}</p>
              )}
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-nvidia-green">
                  {(Number(p.price) / 1_000_000).toFixed(2)} EUR
                </span>
                <span className="text-sm text-muted">
                  Stock: {Number(p.stock)}
                </span>
              </div>
              {isOwner && (
                <button
                  onClick={() => startEdit(p)}
                  className="w-full px-4 py-2 text-sm font-bold border border-hairline text-ink
                             hover:bg-surface-soft transition-colors"
                >
                  Editar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-canvas border border-hairline p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-ink mb-4">Editar Producto</h3>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">Precio (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase font-bold mb-2">Stock</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-4 py-3 border border-hairline text-sm bg-canvas text-ink
                             focus:border-nvidia-green focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={txPending}
                  className="px-4 py-2 text-sm font-bold bg-nvidia-green text-ink
                             hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
                >
                  {txPending ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-sm font-bold border border-hairline text-ink
                             hover:bg-surface-soft transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="border border-hairline bg-canvas p-8 text-center">
        <p className="text-muted">No hay facturas</p>
      </div>
    );
  }

  return (
    <div className="border border-hairline bg-canvas">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              <th className="px-4 py-3 text-left text-xs text-muted uppercase font-bold">ID</th>
              <th className="px-4 py-3 text-left text-xs text-muted uppercase font-bold">Cliente</th>
              <th className="px-4 py-3 text-left text-xs text-muted uppercase font-bold">Monto</th>
              <th className="px-4 py-3 text-left text-xs text-muted uppercase font-bold">Estado</th>
              <th className="px-4 py-3 text-left text-xs text-muted uppercase font-bold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={Number(inv.invoiceId)} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 text-sm font-mono text-ink">#{Number(inv.invoiceId)}</td>
                <td className="px-4 py-3 text-sm font-mono text-ink">
                  {inv.customerAddress.slice(0, 6)}...{inv.customerAddress.slice(-4)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-nvidia-green">
                  {(Number(inv.totalAmount) / 1_000_000).toFixed(2)} EUR
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-bold ${inv.isPaid ? "bg-green-50 text-success" : "bg-yellow-50 text-warning"}`}>
                    {inv.isPaid ? "Pagada" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {new Date(Number(inv.timestamp) * 1000).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
