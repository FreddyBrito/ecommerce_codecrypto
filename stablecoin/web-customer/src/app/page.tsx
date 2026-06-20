"use client";

import { useEffect, useState, useRef } from "react";
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

export default function ProductsPage() {
  const wallet = useWallet();
  const { getAllProducts, addToCart } = useEcommerce();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const loadedRef = useRef(false);
  const cartLoadedRef = useRef(false);

  useEffect(() => {
    if (cartLoadedRef.current) return;
    cartLoadedRef.current = true;
    setCart(getLocalCart());
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoadingProducts(true);
    getAllProducts()
      .then((p) => {
        setProducts(p);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, [getAllProducts]);

  const handleAddToCart = async (productId: number) => {
    if (!wallet.address) {
      wallet.connect();
      return;
    }

    setAddingId(productId);
    try {
      await addToCart(wallet.signer!, productId, 1);

      const existing = cart.find((item) => item.productId === productId);
      let newCart: CartItem[];
      if (existing) {
        newCart = cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...cart, { productId, quantity: 1 }];
      }
      setCart(newCart);
      saveLocalCart(newCart);
    } catch {
      // Error handled by hook
    } finally {
      setAddingId(null);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header cartCount={cartCount} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Productos</h1>
          <p className="text-muted mt-2">
            Explora our catalogo y paga con EuroTokens
          </p>
        </div>

        {!config.ecommerceAddress ? (
          <div className="border border-hairline bg-canvas p-8">
            <h2 className="text-xl font-bold text-ink mb-4">Configuracion pendiente</h2>
            <code className="block p-4 bg-surface-soft border border-hairline text-sm font-mono">
              NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
            </code>
          </div>
        ) : loadingProducts ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-nvidia-green mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-muted">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-hairline bg-canvas p-8 text-center">
            <p className="text-muted">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={Number(p.productId)} className="border border-hairline bg-canvas p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-ink">{p.name}</h3>
                  {Number(p.stock) === 0 && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-50 text-error">
                      Agotado
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-sm text-muted mb-4">{p.description}</p>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-nvidia-green">
                    {(Number(p.price) / 1_000_000).toFixed(2)} EUR
                  </span>
                  <span className="text-sm text-muted">
                    Stock: {Number(p.stock)}
                  </span>
                </div>
                <button
                  onClick={() => handleAddToCart(Number(p.productId))}
                  disabled={addingId === Number(p.productId) || Number(p.stock) === 0}
                  className="w-full px-4 py-3 text-sm font-bold bg-nvidia-green text-ink
                             hover:bg-nvidia-green-dark disabled:bg-ash disabled:text-on-dark transition-colors"
                >
                  {addingId === Number(p.productId)
                    ? "Agregando..."
                    : Number(p.stock) === 0
                    ? "Sin stock"
                    : wallet.address
                    ? "Agregar al carrito"
                    : "Conectar para comprar"}
                </button>
              </div>
            ))}
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
