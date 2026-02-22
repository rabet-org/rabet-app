"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlertHelpers } from "@/components/ui/alert-toast";
import { LockKeyIcon, FloppyDiskIcon } from "@phosphor-icons/react";

export function SettingsClient() {
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const { success, error } = useAlertHelpers();

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      error("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      if (res.ok) {
        success("Password changed successfully");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        const json = await res.json();
        error(json.error || "Failed to change password");
      }
    } catch (err) {
      error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LockKeyIcon className="size-5" />
            Change Password
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update your password to keep your account secure
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              value={passwordData.current_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  current_password: e.target.value,
                })
              }
              placeholder="Enter current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  new_password: e.target.value,
                })
              }
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirm_password: e.target.value,
                })
              }
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleChangePassword}
            disabled={
              saving ||
              !passwordData.current_password ||
              !passwordData.new_password ||
              !passwordData.confirm_password
            }
          >
            <FloppyDiskIcon className="mr-2 size-4" />
            {saving ? "Saving..." : "Change Password"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
