"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ShieldCheckIcon,
  StarIcon,
  LockKeyIcon,
  BuildingsIcon,
  LinkIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { Combobox } from "@/components/ui/combobox";

type Profile = {
  id: string;
  provider_type: string;
  business_name: string | null;
  full_name: string | null;
  description: string | null;
  portfolio_url: string | null;
  services: Array<{
    category_id: string;
    slug: string;
    name: string;
  }>;
  is_verified: boolean;
  verified_at: string | null;
  average_rating: number;
  total_reviews: number;
  total_unlocks: number;
  created_at: string;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
};

export function ProfileClient({
  initialProfile,
  categories,
}: {
  initialProfile: Profile;
  categories: Category[];
}) {
  if (!initialProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
        <Topbar title="Provider Profile" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Profile data is missing. Please refresh the page.
          </div>
        </main>
      </div>
    );
  }

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [description, setDescription] = useState(profile.description || "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(
    profile.services.map((s) => s.category_id)
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/providers/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          portfolio_url: portfolioUrl,
          service_category_ids: selectedServices,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
        alert("Profile updated successfully!");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update profile");
      }
    } catch (e) {
      alert("Network error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleService = (categoryId: string) => {
    setSelectedServices((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Provider Profile" />
      <main className="flex-1 p-6 w-full max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Provider Profile
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your business information and service offerings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <ShieldCheckIcon
                className={`size-4 ${profile.is_verified ? "text-emerald-500" : "text-muted-foreground"}`}
              />
            </div>
            <div className="text-lg font-semibold">
              {profile.is_verified ? "Verified" : "Unverified"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Rating</span>
              <StarIcon className="size-4 text-amber-500" />
            </div>
            <div className="text-lg font-semibold">
              {profile.average_rating.toFixed(1)} / 5.0
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Reviews</span>
              <StarIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold">{profile.total_reviews}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Unlocks</span>
              <LockKeyIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold">{profile.total_unlocks}</div>
          </Card>
        </div>

        {/* Business Info (Read-only) */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BuildingsIcon className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Business Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Provider Type
              </Label>
              <div className="mt-1 capitalize font-medium">
                {profile.provider_type}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Business Name
              </Label>
              <div className="mt-1 font-medium">
                {profile.business_name || "Not provided"}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <div className="mt-1 font-medium">
                {profile.full_name || "Not provided"}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Member Since
              </Label>
              <div className="mt-1 font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Card>

        {/* Editable Fields */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell clients about your services and experience..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be shown to potential clients
              </p>
            </div>

            <div>
              <Label htmlFor="portfolio">Portfolio / Website URL</Label>
              <div className="relative mt-1.5">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="portfolio"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Services */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Service Categories</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Select the categories that match your services
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={
                  selectedServices.includes(category.id) ? "default" : "outline"
                }
                className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1.5"
                onClick={() => toggleService(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
          {selectedServices.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
              Please select at least one service category
            </p>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setDescription(profile.description || "");
              setPortfolioUrl(profile.portfolio_url || "");
              setSelectedServices(profile.services.map((s) => s.category_id));
            }}
          >
            Reset Changes
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </main>
    </div>
  );
}
