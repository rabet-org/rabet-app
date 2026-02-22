"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: Date;
  replies: Array<{
    id: string;
    message: string;
    is_admin: boolean;
    created_at: Date;
    user: {
      profile: {
        full_name: string;
      };
    };
  }>;
};

export function SupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/me");
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useAlertHelpers();

  const handleCreate = async () => {
    if (!subject || !message) {
      error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets([data.data, ...tickets]);
        setIsCreateOpen(false);
        setSubject("");
        setMessage("");
        setPriority("medium");
        success("Support ticket created successfully");
      } else {
        error("Failed to create ticket");
      }
    } catch (err) {
      error("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage) return;

    try {
      const res = await fetch(`/api/support/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(
          tickets.map((t) =>
            t.id === selectedTicket.id
              ? { ...t, replies: [...t.replies, data.data] }
              : t
          )
        );
        setSelectedTicket({
          ...selectedTicket,
          replies: [...selectedTicket.replies, data.data],
        });
        setReplyMessage("");
        success("Reply sent successfully");
      } else {
        error("Failed to send reply");
      }
    } catch (err) {
      error("Network error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <ClockIcon className="mr-1 size-3" />
            Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <WarningCircleIcon className="mr-1 size-3" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircleIcon className="mr-1 size-3" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Support Center</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get help from our support team
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (tickets.length === 0 && !isCreateOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Support Center</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get help from our support team
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            New Ticket
          </Button>
        </div>
        <EmptyState
          icon={ChatCircleTextIcon}
          title="No support tickets"
          description="Create a ticket to get help from our support team"
          action={{
            label: "Create Ticket",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Support Center</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          New Ticket
        </Button>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.message}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
              <span>{ticket.replies.length} replies</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={5}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Ticket"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <div className="flex gap-2 mt-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-4">
              {/* Original Message */}
              <Card className="p-4 bg-muted/30">
                <div className="text-sm font-medium mb-2">Original Message</div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedTicket.message}
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  {format(new Date(selectedTicket.created_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </Card>

              {/* Replies */}
              {selectedTicket.replies.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Replies</div>
                  {selectedTicket.replies.map((reply) => (
                    <Card
                      key={reply.id}
                      className={`p-4 ${reply.is_admin ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {reply.user.profile.full_name}
                          {reply.is_admin && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Support Team
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {reply.message}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                <div className="space-y-3 pt-2">
                  <Label>Add Reply</Label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                  />
                  <Button onClick={handleReply} disabled={!replyMessage}>
                    Send Reply
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
