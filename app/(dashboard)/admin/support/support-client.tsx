"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import {
  ChatCircleTextIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  replies?: Array<{
    id: string;
    message: string;
    is_admin: boolean;
    user_name: string;
    created_at: string;
  }>;
};

export function SupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { success, error } = useAlertHelpers();

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support?status=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (res.ok) {
        success("Reply sent successfully");
        setReplyMessage("");
        fetchTickets();
      } else {
        error("Failed to send reply");
      }
    } catch (err) {
      error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        success("Status updated successfully");
        fetchTickets();
      } else {
        error("Failed to update status");
      }
    } catch (err) {
      error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "closed":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "low":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "";
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === "all" || ticket.status === filter;
    const matchesSearch =
      search === "" ||
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Support Tickets</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and respond to user support requests
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="open">Open ({statusCounts.open})</SelectItem>
            <SelectItem value="in_progress">
              In Progress ({statusCounts.in_progress})
            </SelectItem>
            <SelectItem value="resolved">
              Resolved ({statusCounts.resolved})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold truncate">{ticket.subject}</h3>
                  <Badge className={cn("shrink-0", getStatusColor(ticket.status))}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <Badge className={cn("shrink-0", getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {ticket.message}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{ticket.user_name}</span>
                  <span>•</span>
                  <span>{ticket.user_email}</span>
                  <span>•</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ticket Details</DialogTitle>
                  </DialogHeader>
                  {selectedTicket && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            User
                          </Label>
                          <p className="font-medium">{selectedTicket.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTicket.user_email}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Status
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getStatusColor(selectedTicket.status)}>
                              {selectedTicket.status}
                            </Badge>
                            <Badge className={getPriorityColor(selectedTicket.priority)}>
                              {selectedTicket.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Subject
                        </Label>
                        <p className="font-medium">{selectedTicket.subject}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Message
                        </Label>
                        <p className="text-sm">{selectedTicket.message}</p>
                      </div>

                      {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Conversation
                          </Label>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedTicket.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={cn(
                                  "p-3 rounded-lg",
                                  reply.is_admin
                                    ? "bg-primary/10 ml-4"
                                    : "bg-muted mr-4"
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {reply.user_name}
                                  </span>
                                  {reply.is_admin && (
                                    <Badge variant="outline" className="text-xs">
                                      Admin
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {new Date(reply.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Reply</Label>
                        <Textarea
                          placeholder="Type your response..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={handleSendReply}
                          disabled={sending || !replyMessage.trim()}
                        >
                          {sending ? "Sending..." : "Send Reply"}
                        </Button>
                        <Select
                          defaultValue={selectedTicket.status}
                          onValueChange={(value) =>
                            handleUpdateStatus(selectedTicket.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <ChatCircleTextIcon className="size-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No tickets found</p>
          </div>
        </Card>
      )}
        </>
      )}
    </div>
  );
}
