import { Topbar } from "@/components/layout/topbar"

export default function AgencyDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Agency Overview" />
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Agency Stats & Updates Placeholder
        </div>
      </main>
    </div>
  )
}
