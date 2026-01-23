import { Topbar } from "@/components/layout/topbar"

export default function AgencyWalletPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="My Wallet" />
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Wallet Transactions & Top-up Placeholder
        </div>
      </main>
    </div>
  )
}
