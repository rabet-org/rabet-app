"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import {
  CurrencyDollarIcon,
  GearIcon,
  EnvelopeIcon,
} from "@phosphor-icons/react";

export function PlatformSettingsClient() {
  const [settings, setSettings] = useState({
    unlock_fee: 50,
    platform_commission: 10,
    min_wallet_balance: 100,
    max_requests_per_user: 50,
    enable_email_notifications: true,
    enable_sms_notifications: false,
    maintenance_mode: false,
    allow_new_registrations: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { success, error } = useAlertHelpers();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/platform-settings");
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setSettings({
          unlock_fee: Number(data.unlock_fee) || 50,
          platform_commission: Number(data.platform_commission) || 10,
          min_wallet_balance: Number(data.min_wallet_balance) || 100,
          max_requests_per_user: Number(data.max_requests_per_user) || 50,
          enable_email_notifications: data.enable_email_notifications === "true",
          enable_sms_notifications: data.enable_sms_notifications === "true",
          maintenance_mode: data.maintenance_mode === "true",
          allow_new_registrations: data.allow_new_registrations === "true",
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        success("Settings saved successfully");
      } else {
        error("Failed to save settings");
      }
    } catch (err) {
      error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Platform Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure platform-wide settings and preferences
        </p>
      </div>

      {fetching ? (
        <div className="space-y-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Financial Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollarIcon className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Financial Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unlock_fee">Default Unlock Fee (EGP)</Label>
                <Input
                  id="unlock_fee"
                  type="number"
                  value={settings.unlock_fee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      unlock_fee: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Platform Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={settings.platform_commission}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      platform_commission: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_balance">
                Minimum Wallet Balance (EGP)
              </Label>
              <Input
                id="min_balance"
                type="number"
                value={settings.min_wallet_balance}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    min_wallet_balance: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Providers must maintain this minimum balance
              </p>
            </div>
          </div>
        </Card>

        {/* System Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <GearIcon className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">System Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_requests">Max Requests Per User</Label>
              <Input
                id="max_requests"
                type="number"
                value={settings.max_requests_per_user}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_requests_per_user: Number(e.target.value),
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Disable platform access for maintenance
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenance_mode: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow New Registrations</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable new user signups
                </p>
              </div>
              <Switch
                checked={settings.allow_new_registrations}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allow_new_registrations: checked })
                }
              />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <EnvelopeIcon className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send email notifications to users
                </p>
              </div>
              <Switch
                checked={settings.enable_email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    enable_email_notifications: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send SMS notifications to users
                </p>
              </div>
              <Switch
                checked={settings.enable_sms_notifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    enable_sms_notifications: checked,
                  })
                }
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={loading}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
