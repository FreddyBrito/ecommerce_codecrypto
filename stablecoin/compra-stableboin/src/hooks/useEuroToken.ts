"use client";

import { useState, useCallback } from "react";
import { Contract, parseUnits } from "ethers";
import { EUROTOKEN_ABI } from "@/lib/abi";
import { config } from "@/lib/config";

interface EuroTokenState {
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export function useEuroToken(signer: unknown, address: string | null) {
  const [state, setState] = useState<EuroTokenState>({
    balance: "0",
    isLoading: false,
    error: null,
  });

  const getContract = useCallback(
    (signerOrProvider: unknown) => {
      return new Contract(config.eurotokenAddress, EUROTOKEN_ABI, signerOrProvider as never);
    },
    []
  );

  const fetchBalance = useCallback(
    async (walletAddress: string) => {
      if (!config.eurotokenAddress) {
        setState((s) => ({ ...s, error: "Contrato EuroToken no configurado" }));
        return;
      }

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const provider = new (await import("ethers")).BrowserProvider(window.ethereum!);
        const contract = getContract(provider);
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
      }
    },
    [getContract]
  );

  const approve = useCallback(
    async (amount: number) => {
      if (!signer || !address) {
        throw new Error("Wallet no conectada");
      }
      const contract = getContract(signer);
      const decimals = await contract.decimals();
      const tx = await contract.approve(
        config.eurotokenAddress,
        parseUnits(amount.toString(), Number(decimals))
      );
      return tx.wait();
    },
    [signer, address, getContract]
  );

  return { ...state, fetchBalance, approve, getContract };
}
