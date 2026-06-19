export const config = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || "31337"),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545",
  eurotokenAddress: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || "",
  stripePublishableKey:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
} as const;
