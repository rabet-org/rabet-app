"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeIcon, ArrowLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Rabet
          </h1>
          <p className="text-muted-foreground">
            Reset your password to regain access.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-border/50 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Forgot Password</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-sm p-4 rounded-md">
                <p className="font-medium mb-1">Email sent!</p>
                <p>
                  Check your inbox for a password reset link. It may take a few
                  minutes to arrive.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <FloatingInput
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<EnvelopeIcon className="size-4" />}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back to Sign In
                </Button>
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
