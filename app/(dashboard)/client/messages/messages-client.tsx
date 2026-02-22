"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChatCircleTextIcon,
  MagnifyingGlassIcon,
  PaperPlaneIcon,
} from "@phosphor-icons/react";

type Message = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function MessagesClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/users/me/notifications");
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      search === "" ||
      msg.title.toLowerCase().includes(search.toLowerCase()) ||
      msg.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Messages & Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Stay updated with platform notifications and messages
        </p>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ChatCircleTextIcon className="size-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {filteredMessages.map((msg) => (
              <Card
                key={msg.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedMessage?.id === msg.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                } ${!msg.is_read ? "border-l-4 border-l-primary" : ""}`}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.is_read) markAsRead(msg.id);
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {msg.title}
                  </h3>
                  {!msg.is_read && (
                    <Badge className="shrink-0 bg-primary text-xs">New</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {msg.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(msg.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-xl font-semibold">
                        {selectedMessage.title}
                      </h2>
                      {!selectedMessage.is_read && (
                        <Badge className="bg-primary">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <PaperPlaneIcon className="size-12 mx-auto mb-4 opacity-30" />
                  <p>Select a message to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
