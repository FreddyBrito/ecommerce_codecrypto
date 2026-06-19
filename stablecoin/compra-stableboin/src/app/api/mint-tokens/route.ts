import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import { EUROTOKEN_ABI } from "@/lib/abi";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount, paymentIntentId } = await request.json();

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: "walletAddress y amount son requeridos" },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;

    if (!privateKey || !contractAddress) {
      return NextResponse.json(
        { error: "Configuracion de servidor incompleta" },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const contract = new Contract(contractAddress, EUROTOKEN_ABI, wallet);

    const decimals = await contract.decimals();
    const tokenAmount = parseUnits(amount.toString(), Number(decimals));

    const tx = await contract.mint(walletAddress, tokenAmount);
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt?.hash,
      amount: amount.toString(),
      walletAddress,
      paymentIntentId,
    });
  } catch (err) {
    console.error("Error minting tokens:", err);
    return NextResponse.json(
      { error: "Error al acuñar tokens" },
      { status: 500 }
    );
  }
}
