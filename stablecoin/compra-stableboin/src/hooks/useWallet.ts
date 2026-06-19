"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { config } from "@/lib/config";

interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  chainId: number | null;
  balance: string;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    signer: null,
    chainId: null,
    balance: "0",
    isConnecting: false,
    error: null,
  });

  const isCorrectChain = state.chainId === config.chainId;

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((s) => ({ ...s, error: "MetaMask no esta instalado" }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      setState({
        address,
        signer,
        chainId: Number(network.chainId),
        balance: (Number(balance) / 1e18).toString(),
        isConnecting: false,
        error: null,
      });

      if (Number(network.chainId) !== config.chainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${config.chainId.toString(16)}` }],
          });
        } catch {
          setState((s) => ({
            ...s,
            error: `Cambia a la red chainId ${config.chainId} en MetaMask`,
          }));
        }
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Error al conectar",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      signer: null,
      chainId: null,
      balance: "0",
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else if (state.signer) {
        connect();
      }
    };

    const handleChainChanged = () => {
      connect();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, disconnect, state.signer]);

  return { ...state, connect, disconnect, isCorrectChain };
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
