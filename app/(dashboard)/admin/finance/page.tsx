import { Topbar } from "@/components/layout/topbar"

export default function AdminFinancePage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Finance & Refunds" />
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Finance Overview Placeholder
        </div>
      </main>
    </div>
  )
}
