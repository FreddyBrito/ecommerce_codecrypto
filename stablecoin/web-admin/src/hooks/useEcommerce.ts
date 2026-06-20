"use client";

import { useCallback, useState } from "react";
import { Contract, JsonRpcProvider, JsonRpcSigner } from "ethers";
import { config } from "@/lib/config";
import { ECOMMERCE_ABI } from "@/lib/abi";

export interface Company {
  companyId: bigint;
  name: string;
  companyAddress: string;
  taxId: string;
  isActive: boolean;
}

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

export function useEcommerce() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerCompany = useCallback(async (signer: JsonRpcSigner, name: string, taxId: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const tx = await contract.registerCompany(name, taxId);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error registering company";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const getCompany = useCallback(async (companyId: number): Promise<Company> => {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, provider);
    return await contract.getCompany(companyId) as Company;
  }, []);

  const getCompanyByOwner = useCallback(async (address: string): Promise<bigint> => {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, provider);
    return await contract.getCompanyByOwner(address) as bigint;
  }, []);

  const getCompanyProducts = useCallback(async (companyId: number): Promise<Product[]> => {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, provider);
    const products = await contract.getCompanyProducts(companyId) as Product[];
    return products;
  }, []);

  const addProduct = useCallback(async (
    signer: JsonRpcSigner,
    companyId: number,
    name: string,
    description: string,
    price: number,
    stock: number,
    ipfsImageHash: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const priceWei = BigInt(Math.round(price * 1_000_000));
      const tx = await contract.addProduct(companyId, name, description, priceWei, stock, ipfsImageHash);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error adding product";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (signer: JsonRpcSigner, productId: number, price: number, stock: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, signer);
      const priceWei = BigInt(Math.round(price * 1_000_000));
      const tx = await contract.updateProduct(productId, priceWei, stock);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error updating product";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  const getCompanyInvoices = useCallback(async (companyId: number): Promise<Invoice[]> => {
    const provider = new JsonRpcProvider(config.rpcUrl);
    const contract = new Contract(config.ecommerceAddress, ECOMMERCE_ABI, provider);
    const invoiceIds = await contract.getCompanyInvoices(companyId) as bigint[];
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
    registerCompany,
    getCompany,
    getCompanyByOwner,
    getCompanyProducts,
    addProduct,
    updateProduct,
    getCompanyInvoices,
  };
}
