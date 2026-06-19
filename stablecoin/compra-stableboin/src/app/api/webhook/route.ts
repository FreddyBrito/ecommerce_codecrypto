import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import { EUROTOKEN_ABI } from "@/lib/abi";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const walletAddress = paymentIntent.metadata.walletAddress;
    const tokenAmount = paymentIntent.metadata.tokenAmount;

    if (!walletAddress || !tokenAmount) {
      console.error("Missing metadata in payment intent:", paymentIntent.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
      const privateKey = process.env.WALLET_PRIVATE_KEY;
      const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

      if (!privateKey || !contractAddress) {
        console.error("Server config missing");
        return NextResponse.json({ error: "Server config incomplete" }, { status: 500 });
      }

      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      const contract = new Contract(contractAddress, EUROTOKEN_ABI, wallet);

      const decimals = await contract.decimals();
      const tokenAmountWei = parseUnits(tokenAmount, Number(decimals));

      const tx = await contract.mint(walletAddress, tokenAmountWei);
      const receipt = await tx.wait();

      console.log(
        `Minted ${tokenAmount} EURT to ${walletAddress} | TX: ${receipt?.hash}`
      );

      return NextResponse.json({
        success: true,
        txHash: receipt?.hash,
        walletAddress,
        amount: tokenAmount,
      });
    } catch (err) {
      console.error("Error minting tokens:", err);
      return NextResponse.json({ error: "Mint failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
