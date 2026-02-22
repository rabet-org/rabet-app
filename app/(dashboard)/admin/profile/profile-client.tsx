"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import { UserCircleIcon, FloppyDiskIcon } from "@phosphor-icons/react";

type UserProfile = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
};

export function ProfileClient() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });
  const { success, error } = useAlertHelpers();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        setFormData({
          full_name: json.data.full_name || "",
          phone: json.data.phone || "",
        });
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch profile:", res.status, errorText);
        
        if (res.status === 401) {
          error("Session expired. Please login again.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          error("Failed to load profile");
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        success("Profile updated successfully");
        fetchProfile();
      } else {
        const json = await res.json();
        error(json.error || "Failed to update profile");
      }
    } catch (err) {
      error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-20 rounded-full bg-primary/15 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="size-20 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="size-12 text-primary" />
            )}
          </div>
          <div>
            <p className="font-semibold">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {profile?.role} Account
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+20 123 456 7890"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            <FloppyDiskIcon className="mr-2 size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
