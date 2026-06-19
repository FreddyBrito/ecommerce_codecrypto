"use client";

import { useState, useCallback } from "react";
import { BrowserProvider, Contract, parseUnits, formatUnits } from "ethers";
import { EUROTOKEN_ABI } from "@/lib/abi";
import { config } from "@/lib/config";

export function useEuroToken() {
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async (walletAddress: string) => {
    if (!config.eurotokenAddress) return;
    setIsLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const contract = new Contract(config.eurotokenAddress, EUROTOKEN_ABI, provider);
      const raw = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();
      setBalance(formatUnits(raw, Number(decimals)));
    } catch {
      setBalance("0");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const transfer = useCallback(async (signer: unknown, to: string, amount: number) => {
    const contract = new Contract(config.eurotokenAddress, EUROTOKEN_ABI, signer as never);
    const decimals = await contract.decimals();
    const tx = await contract.transfer(to, parseUnits(amount.toString(), Number(decimals)));
    return tx.wait();
  }, []);

  const hasEnoughBalance = useCallback((amount: number) => {
    return parseFloat(balance) >= amount;
  }, [balance]);

  return { balance, isLoading, fetchBalance, transfer, hasEnoughBalance };
}
