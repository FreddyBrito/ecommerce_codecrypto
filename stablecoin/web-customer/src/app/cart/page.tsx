"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useEcommerce, type Product } from "@/hooks/useEcommerce";
import { config } from "@/lib/config";

interface CartItem {
  productId: number;
  quantity: number;
}

function getLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

function saveLocalCart(cart: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export default function CartPage() {
  const wallet = useWallet();
  const { getAllProducts, createInvoice } = useEcommerce();
  const [cart, setCart] = useState<CartItem[]>(() => getLocalCart());
  const [products, setProducts] = useState<Map<number, Product>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const cartEmpty = cart.length === 0;

  useEffect(() => {
    if (loadedRef.current || cartEmpty) return;
    loadedRef.current = true;
    setLoadingProducts(true);
    getAllProducts()
      .then((allProducts) => {
        const map = new Map<number, Product>();
        for (const p of allProducts) {
          map.set(Number(p.productId), p);
        }
        setProducts(map);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, [getAllProducts, cartEmpty]);

  const updateQuantity = (productId: number, delta: number) => {
    const newCart = cart
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    setCart(newCart);
    saveLocalCart(newCart);
  };

  const removeItem = (productId: number) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    setCart(newCart);
    saveLocalCart(newCart);
  };

  const total = cart.reduce((sum, item) => {
    const product = products.get(item.productId);
    if (!product) return sum;
    return sum + (Number(product.price) / 1_000_000) * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (!wallet.signer || !wallet.address) return;

    setTxPending(true);
    setError(null);
    try {
      const invoiceId = await createInvoice(wallet.signer, wallet.address);
      saveLocalCart([]);
      setCart([]);

      if (invoiceId > BigInt(0) && config.pasarelaUrl) {
        const params = new URLSearchParams({
          merchant_address: wallet.address,
          amount: total.toFixed(2),
          invoice: `INV-${invoiceId}`,
          date: new Date().toISOString().split("T")[0],
          redirect: "http://localhost:6004/orders",
        });
        const url = `${config.pasarelaUrl}?${params.toString()}`;
        window.location.assign(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear factura");
    } finally {
      setTxPending(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header cartCount={cartCount} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Carrito de Compras</h1>
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
        ) : loadingProducts ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-nvidia-green mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-muted">Cargando carrito...</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <h2 className="text-xl font-bold text-ink mb-4">Tu carrito esta vacio</h2>
            <Link
              href="/"
              className="inline-block px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                         hover:bg-nvidia-green-dark transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="border border-hairline bg-canvas">
                {cart.map((item) => {
                  const product = products.get(item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-6 border-b border-hairline last:border-0"
                    >
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-ink">{product.name}</h3>
                        <p className="text-sm text-muted">
                          {(Number(product.price) / 1_000_000).toFixed(2)} EUR x unidad
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-8 h-8 flex items-center justify-center border border-hairline text-ink
                                       hover:bg-surface-soft transition-colors text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-8 h-8 flex items-center justify-center border border-hairline text-ink
                                       hover:bg-surface-soft transition-colors text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-nvidia-green w-24 text-right">
                          {((Number(product.price) / 1_000_000) * item.quantity).toFixed(2)} EUR
                        </span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-muted hover:text-error transition-colors text-sm"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-hairline bg-canvas p-6 h-fit">
              <h2 className="text-lg font-bold text-ink mb-4">Resumen</h2>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-hairline">
                <span className="text-sm text-muted">Subtotal ({cartCount} items)</span>
                <span className="text-sm font-bold text-ink">{total.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-ink">Total</span>
                <span className="text-lg font-bold text-nvidia-green">{total.toFixed(2)} EUR</span>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-error text-sm text-error mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={txPending || cart.length === 0}
                className="w-full px-6 py-3 text-base font-bold bg-nvidia-green text-ink
                           hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
              >
                {txPending ? "Procesando..." : "Pagar con EURT"}
              </button>
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
