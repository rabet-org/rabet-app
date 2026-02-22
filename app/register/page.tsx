"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LockKeyIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  BriefcaseIcon,
  UserCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingsIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UserType = "client" | "provider" | null;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    business_name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setTimeout(() => setStep(2), 300);
  };

  const handleNext = () => {
    if (step === 2) {
      if (!formData.email || !formData.full_name) {
        setError("Please fill in all required fields");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }
      setError("");
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) {
      setStep(1);
      setUserType(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter");
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError("Password must contain at least one number");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: userType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      const loginRes = await fetch("/api/auth/proxy-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginRes.ok) {
        throw new Error("Login failed after registration");
      }

      const loginData = await loginRes.json();

      if (userType === "provider" && formData.business_name) {
        try {
          await fetch("/api/provider-applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              provider_type: "agency",
              business_name: formData.business_name,
              description: formData.description || "No description provided",
              portfolio_url: null,
              verification_docs: {},
            }),
          });
        } catch (appErr) {
          console.error("Failed to create provider application:", appErr);
        }
      }

      const role = loginData.user?.role || "client";

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "provider") {
        router.push("/provider");
      } else {
        router.push("/client");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-muted";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-orange-500";
    if (passwordStrength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Rabet</h1>
          <p className="text-muted-foreground">
            Join thousands of professionals connecting on Rabet
          </p>
        </div>

        <Card className="p-8 shadow-xl border-border/50">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {[
                { num: 1, label: "Account Type" },
                { num: 2, label: "Your Info" },
                { num: 3, label: "Security" },
              ].map((item) => (
                <div key={item.num} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                      step >= item.num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {step > item.num ? (
                      <CheckCircleIcon className="size-5" weight="fill" />
                    ) : (
                      item.num
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors hidden sm:block",
                      step >= item.num ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    step >= i ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive text-sm p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Choose Account Type</h2>
                <p className="text-muted-foreground">
                  Select how you want to use Rabet
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => handleUserTypeSelect("client")}
                  className="group p-6 border-2 border-border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UserCircleIcon className="size-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Client</h3>
                      <p className="text-sm text-muted-foreground">
                        Looking for service providers
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleUserTypeSelect("provider")}
                  className="group p-6 border-2 border-border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BuildingsIcon className="size-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Provider</h3>
                      <p className="text-sm text-muted-foreground">
                        Offering services to clients
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
                <p className="text-muted-foreground">
                  Tell us about yourself
                </p>
              </div>

              <div className="space-y-4">
                <FloatingInput
                  label="Full Name"
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  icon={<UserIcon className="size-4" />}
                />

                <FloatingInput
                  label="Email Address"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  icon={<EnvelopeIcon className="size-4" />}
                />

                <FloatingInput
                  label="Phone Number (Optional)"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={<PhoneIcon className="size-4" />}
                />

                {userType === "provider" && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <BriefcaseIcon className="size-4" />
                      <span>Business Information</span>
                    </div>

                    <FloatingInput
                      label="Business Name"
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      icon={<BuildingsIcon className="size-4" />}
                    />

                    <div className="relative">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder=" "
                        rows={4}
                        className="peer w-full rounded-lg border border-input bg-background px-4 py-3 text-sm transition-all placeholder-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                      <label className="absolute left-4 top-3 transition-all duration-200 pointer-events-none text-muted-foreground peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background peer-focus:px-1">
                        Business Description
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Continue
                  <ArrowRightIcon className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Secure Your Account</h2>
                <p className="text-muted-foreground">
                  Create a strong password
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <FloatingInput
                    label="Password"
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    icon={<LockKeyIcon className="size-4" />}
                  />
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              i <= passwordStrength
                                ? getPasswordStrengthColor()
                                : "bg-muted",
                            )}
                          />
                        ))}
                      </div>
                      {passwordStrength > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Password strength: <span className="font-medium">{getPasswordStrengthText()}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <FloatingInput
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={<LockKeyIcon className="size-4" />}
                />

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium">Password requirements:</p>
                  <ul className="space-y-1.5">
                    {[
                      { text: "At least 8 characters", met: formData.password.length >= 8 },
                      { text: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
                      { text: "One number", met: /[0-9]/.test(formData.password) },
                    ].map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <div
                          className={cn(
                            "size-4 rounded-full flex items-center justify-center",
                            req.met ? "bg-green-500" : "bg-muted",
                          )}
                        >
                          {req.met && (
                            <CheckCircleIcon className="size-3 text-white" weight="bold" />
                          )}
                        </div>
                        <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                          {req.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
