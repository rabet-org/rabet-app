"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import {
  PaperPlaneIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

type Message = {
  id: string;
  title: string;
  message: string;
  target_role: string;
  sent_count: number;
  created_at: string;
};

export function MessagesClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_role: "all",
  });
  const { success, error } = useAlertHelpers();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        success("Message sent successfully");
        setFormData({ title: "", message: "", target_role: "all" });
        fetchMessages();
      } else {
        error("Failed to send message");
      }
    } catch (err) {
      error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Broadcast Messages</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send notifications to users based on their role
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Send New Message</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Audience</Label>
                <Select
                  value={formData.target_role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, target_role: value })
                  }
                >
                  <SelectTrigger id="target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="client">Clients Only</SelectItem>
                    <SelectItem value="provider">Providers Only</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Message Title</Label>
                <Input
                  id="title"
                  placeholder="Enter message title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full"
                size="lg"
              >
                <PaperPlaneIcon className="size-5 mr-2" />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Message History</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <PaperPlaneIcon className="size-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No messages sent yet
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {msg.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {msg.target_role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {msg.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="size-3" />
                        <span>{msg.sent_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        <span>
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
