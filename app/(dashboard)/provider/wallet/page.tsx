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

  if (!walletRes.ok) {
    const errorData = await walletRes.json().catch(() => ({ message: "Unknown error" }));
    console.error("Wallet fetch error:", errorData);
    throw new Error(errorData.message || "Failed to fetch wallet data");
  }

  if (!transactionsRes.ok) {
    const errorData = await transactionsRes.json().catch(() => ({ message: "Unknown error" }));
    console.error("Transactions fetch error:", errorData);
    throw new Error(errorData.message || "Failed to fetch transactions");
  }

  const wallet = await walletRes.json();
  const transactions = await transactionsRes.json();

  // Validate the response structure
  if (!wallet || !wallet.id) {
    throw new Error("Invalid wallet response structure");
  }

  if (!transactions || !transactions.data) {
    throw new Error("Invalid transactions response structure");
  }

  return { wallet: wallet, transactions: transactions };
}

export default async function ProviderWalletPage() {
  let data;
  try {
    data = await getWalletData();
  } catch (error) {
    console.error("Wallet data fetch error:", error);
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

  // Ensure data is valid before rendering
  if (!data || !data.wallet) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="My Wallet" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Wallet not found. Please complete your provider profile setup.
          </div>
        </main>
      </div>
    );
  }

  return <WalletClient initialWallet={data.wallet} initialTransactions={data.transactions} />;
}
