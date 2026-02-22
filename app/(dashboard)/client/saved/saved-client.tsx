"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StarIcon,
  HeartIcon,
  UserIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import { EmptyState } from "@/components/ui/empty-state";

type SavedProvider = {
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
    };
  }>;
  _count: {
    reviews: number;
  };
  avgRating: number;
};

export function SavedProvidersClient({
  initialSaved,
}: {
  initialSaved: SavedProvider[];
}) {
  const [saved, setSaved] = useState<SavedProvider[]>(initialSaved);
  const { success } = useAlertHelpers();

  const handleRemove = (providerId: string) => {
    setSaved(saved.filter((p) => p.id !== providerId));
    success("Provider removed from saved");
  };

  if (saved.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Saved Providers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your favorite service providers
          </p>
        </div>
        <EmptyState
          icon={HeartIcon}
          title="No saved providers yet"
          description="Save providers you like to easily find them later"
          action={{
            label: "Browse Providers",
            href: "/client/providers",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Saved Providers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {saved.length} saved provider{saved.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {saved.map((provider) => (
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
                onClick={() => handleRemove(provider.id)}
                className="p-2 text-destructive hover:text-destructive"
              >
                <TrashIcon className="size-5" />
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

            <div className="flex gap-2">
              <Button className="flex-1" variant="outline">
                View Profile
              </Button>
              <Button className="flex-1">Contact</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
