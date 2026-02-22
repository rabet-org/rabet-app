import { Topbar } from "@/components/layout/topbar";

export default function ProviderDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Provider Overview" />
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Provider Stats & Updates Placeholder
        </div>
      </main>
    </div>
  );
}
