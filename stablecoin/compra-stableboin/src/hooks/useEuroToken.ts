"use client";

import { useState, useCallback, useRef } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import { EUROTOKEN_ABI } from "@/lib/abi";
import { config } from "@/lib/config";

interface EuroTokenState {
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export function useEuroToken() {
  const [state, setState] = useState<EuroTokenState>({
    balance: "0",
    isLoading: false,
    error: null,
  });
  const fetchingRef = useRef(false);

  const fetchBalance = useCallback(async (walletAddress: string) => {
    if (!config.eurotokenAddress) {
      setState((s) => ({ ...s, error: "Contrato EuroToken no configurado" }));
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const contract = new Contract(config.eurotokenAddress, EUROTOKEN_ABI, provider);
      const raw = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();
      const formatted = Number(raw) / 10 ** Number(decimals);
      setState({ balance: formatted.toFixed(2), isLoading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Error al obtener balance",
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const approve = useCallback(async (signer: unknown, address: string, amount: number) => {
    if (!signer || !address) {
      throw new Error("Wallet no conectada");
    }
    const contract = new Contract(config.eurotokenAddress, EUROTOKEN_ABI, signer as never);
    const decimals = await contract.decimals();
    const tx = await contract.approve(
      config.eurotokenAddress,
      parseUnits(amount.toString(), Number(decimals))
    );
    return tx.wait();
  }, []);

  return { ...state, fetchBalance, approve };
}
