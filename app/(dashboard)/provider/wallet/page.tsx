import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { WalletClient } from "./wallet-client";

async function getWalletData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const [walletRes, transactionsRes] = await Promise.all([
    fetch(`${baseUrl}/providers/me/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${baseUrl}/providers/me/wallet/transactions?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!walletRes.ok || !transactionsRes.ok) {
    throw new Error("Failed to fetch wallet data");
  }

  const wallet = await walletRes.json();
  const transactions = await transactionsRes.json();

  return { wallet: wallet.data, transactions: transactions.data };
}

export default async function ProviderWalletPage() {
  let data;
  try {
    data = await getWalletData();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="My Wallet" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading wallet data. Please ensure you have a provider profile.
          </div>
        </main>
      </div>
    );
  }

  return <WalletClient initialWallet={data.wallet} initialTransactions={data.transactions} />;
}
