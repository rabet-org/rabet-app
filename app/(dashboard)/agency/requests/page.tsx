import { Topbar } from "@/components/layout/topbar"

export default function AgencyRequestsPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Browse Requests" />
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Service Requests Feed Placeholder
        </div>
      </main>
    </div>
  )
}
