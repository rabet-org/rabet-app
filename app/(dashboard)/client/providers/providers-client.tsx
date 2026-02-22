"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon,
  BriefcaseIcon,
  HeartIcon,
  CheckCircleIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";

type Provider = {
  id: string;
  user: {
    profile: {
      full_name: string;
      avatar_url: string | null;
    };
  };
  description: string | null;
  is_verified: boolean;
  services: Array<{
    category: {
      name: string;
      slug: string;
    };
  }>;
  _count: {
    reviews: number;
  };
  avgRating: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export function ProvidersClient({
  initialProviders,
  categories,
}: {
  initialProviders: Provider[];
  categories: Category[];
}) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [savedProviders, setSavedProviders] = useState<Set<string>>(new Set());
  const { success } = useAlertHelpers();

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);

      const res = await fetch(`/api/providers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveProvider = (providerId: string) => {
    const newSaved = new Set(savedProviders);
    if (newSaved.has(providerId)) {
      newSaved.delete(providerId);
      success("Provider removed from saved");
    } else {
      newSaved.add(providerId);
      success("Provider saved successfully");
    }
    setSavedProviders(newSaved);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Browse Providers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Find and connect with verified service providers
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search providers by name or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-12"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px] h-12">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading} className="h-12">
            <MagnifyingGlassIcon className="mr-2 size-4" />
            Search
          </Button>
        </div>
      </Card>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className="p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {provider.user.profile.avatar_url ? (
                  <img
                    src={provider.user.profile.avatar_url}
                    alt={provider.user.profile.full_name}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="size-6 text-primary" />
                  </div>
                )}
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {provider.user.profile.full_name}
                    {provider.is_verified && (
                      <CheckCircleIcon
                        className="size-4 text-primary"
                        weight="fill"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <StarIcon className="size-4 text-amber-500" weight="fill" />
                    <span className="font-medium">
                      {provider.avgRating.toFixed(1)}
                    </span>
                    <span>({provider._count.reviews})</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSaveProvider(provider.id)}
                className="p-2"
              >
                <HeartIcon
                  className="size-5"
                  weight={savedProviders.has(provider.id) ? "fill" : "regular"}
                  color={
                    savedProviders.has(provider.id) ? "#ef4444" : "currentColor"
                  }
                />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {provider.description || "No description available"}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {provider.services.slice(0, 3).map((service, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {service.category.name}
                </Badge>
              ))}
              {provider.services.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.services.length - 3} more
                </Badge>
              )}
            </div>

            <Button className="w-full" variant="outline">
              View Profile
            </Button>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card className="p-12 text-center">
          <UserIcon className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No providers found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </Card>
      )}
    </div>
  );
}
