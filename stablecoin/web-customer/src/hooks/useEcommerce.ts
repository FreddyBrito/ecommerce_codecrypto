"use client";

import { useCallback, useState } from "react";
import { Contract, JsonRpcProvider, JsonRpcSigner } from "ethers";
import { config } from "@/lib/config";
import { ECOMMERCE_ABI } from "@/lib/abi";

export interface Product {
  productId: bigint;
  companyId: bigint;
  name: string;
  description: string;
  price: bigint;
  stock: bigint;
  ipfsImageHash: string;
  isActive: boolean;
}

export interface Invoice {
  invoiceId: bigint;
  companyId: bigint;
  customerAddress: string;
  totalAmount: bigint;
  timestamp: bigint;
  isPaid: boolean;
  paymentTxHash: string;
}

function getReadContract() {
  const provider = new JsonRpcProvider(config.rpcUrl);
  return new Contract(config.ecommerceAddress, ECOMMERCE_ABI, provider);
}

export function useEcommerce() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllProducts = useCallback(async (): Promise<Product[]> => {
    const contract = getReadContract();
    return await contract.getAllProducts() as Product[];
  }, []);

  const addToCart = useCallback(async (signer: JsonRpcSigner, productId: number, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const tx = await contract.addToCart(productId, quantity);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error adding to cart";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const getCart = useCallback(async (address: string): Promise<{ productId: bigint; quantity: bigint }[]> => {
    const contract = getReadContract();
    return await contract.getCart(address) as { productId: bigint; quantity: bigint }[];
  }, []);

  const removeCartItem = useCallback(async (signer: JsonRpcSigner, productId: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const tx = await contract.removeCartItem(productId);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error removing item";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const clearMyCart = useCallback(async (signer: JsonRpcSigner) => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const tx = await contract.clearMyCart();
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error clearing cart";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const createInvoice = useCallback(async (signer: JsonRpcSigner, customer: string): Promise<bigint> => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const tx = await contract.createInvoice(customer);
      const receipt = await tx.wait();
      setLoading(false);
      const invoiceId = receipt.logs[0]?.args?.[0] as bigint || BigInt(0);
      return invoiceId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error creating invoice";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const getInvoice = useCallback(async (invoiceId: number): Promise<Invoice> => {
    const contract = getReadContract();
    return await contract.getInvoice(invoiceId) as Invoice;
  }, []);

  const getCustomerInvoices = useCallback(async (address: string): Promise<Invoice[]> => {
    const contract = getReadContract();
    const invoiceIds = await contract.getCustomerInvoices(address) as bigint[];
    const invoices: Invoice[] = [];
    for (const id of invoiceIds) {
      const invoice = await contract.getInvoice(Number(id)) as Invoice;
      invoices.push(invoice);
    }
    return invoices;
  }, []);

  return {
    loading,
    error,
    getAllProducts,
    addToCart,
    getCart,
    removeCartItem,
    clearMyCart,
    createInvoice,
    getInvoice,
    getCustomerInvoices,
  };
}
