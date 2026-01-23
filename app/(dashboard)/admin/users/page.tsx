import { Topbar } from "@/components/layout/topbar"

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="User Management" />
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          User Management Table Placeholder
        </div>
      </main>
    </div>
  )
}
