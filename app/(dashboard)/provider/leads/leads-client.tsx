"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Lead = {
  id: string;
  unlock_fee: number;
  status: string;
  unlocked_at: string;
  request: {
    id: string;
    title: string;
    category: {
      name: string;
      slug: string;
    };
    budget_range: string | null;
    client: {
      full_name: string;
      email: string;
      phone: string | null;
    };
  };
};

export function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="My Leads" />
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Unlocked Leads
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage client contacts you've unlocked
          </p>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Request</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Unlocked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No leads unlocked yet. Browse requests to unlock client
                      contacts.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell>
                        <div className="font-medium group-hover:text-primary transition-colors">
                          {lead.request.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ID: {lead.request.id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <TagIcon className="mr-1 size-3" />
                          {lead.request.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {lead.request.client.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.request.budget_range || "Not specified"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(lead.unlocked_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(lead.unlocked_at), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Lead Detail Dialog */}
        <Dialog
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
        >
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-5 pb-1">
                {/* Request Info */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Request</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Title
                      </span>
                      <span className="font-medium text-base">
                        {selectedLead.request.title}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Category
                        </span>
                        <Badge variant="outline">
                          {selectedLead.request.category.name}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">
                          Budget Range
                        </span>
                        <span className="font-medium text-sm">
                          {selectedLead.request.budget_range || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Contact Info */}
                <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                  <div className="px-4 py-2.5 border-b border-emerald-500/20">
                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Client Contact Information
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {selectedLead.request.client.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {selectedLead.request.client.full_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <EnvelopeIcon className="size-4 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${selectedLead.request.client.email}`}
                        className="text-primary hover:underline font-mono"
                      >
                        {selectedLead.request.client.email}
                      </a>
                    </div>
                    {selectedLead.request.client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneIcon className="size-4 text-muted-foreground shrink-0" />
                        <a
                          href={`tel:${selectedLead.request.client.phone}`}
                          className="text-primary hover:underline font-mono"
                        >
                          {selectedLead.request.client.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unlock Info */}
                <div className="rounded-xl border bg-card">
                  <div className="px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold">Unlock Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Unlock Fee Paid
                      </span>
                      <span className="font-medium font-mono">
                        {selectedLead.unlock_fee.toFixed(2)} EGP
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Status
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      >
                        {selectedLead.status}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Unlocked On
                      </span>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(
                            new Date(selectedLead.unlocked_at),
                            "MMMM d, yyyy 'at' h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
