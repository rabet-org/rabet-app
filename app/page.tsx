import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCircleIcon,
  BuildingsIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparkleIcon,
  RocketLaunchIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">R</span>
            </div>
            <span className="text-xl font-bold">Rabet</span>
          </div>
          <Link href="/login">
            <Button>
              Sign In
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container flex flex-col items-center gap-8 py-24 md:py-32">
        <Badge variant="secondary" className="px-4 py-1.5">
          <SparkleIcon className="mr-2 h-3.5 w-3.5" />
          Trusted by 500+ Service Providers
        </Badge>
        
        <div className="flex max-w-[64rem] flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Connect with the Right{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Service Providers
            </span>
          </h1>
          
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            A marketplace that connects clients with verified service providers. Post your needs, 
            get matched with professionals, and grow your business.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-11 px-8">
                Get Started
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-8">
                I'm a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
            How Rabet Works
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Simple, transparent, and efficient
          </p>
        </div>

        <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 mt-12">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <UserCircleIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="mt-4">For Clients</CardTitle>
              <CardDescription>
                Post requests and find the perfect service provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Post your service requests for free</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Get matched with verified providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Review and choose the best fit</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BuildingsIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="mt-4">For Providers</CardTitle>
              <CardDescription>
                Browse requests and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Browse qualified service requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Unlock client contact information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Grow your business with quality leads</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="mt-4">Trusted Platform</CardTitle>
              <CardDescription>
                Secure and reliable marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Verified provider profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Secure payment system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Rating and review system</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/50">
        <div className="container py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="text-4xl font-bold text-primary">500+</div>
              <p className="text-sm text-muted-foreground">Active Providers</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="text-4xl font-bold text-primary">1,200+</div>
              <p className="text-sm text-muted-foreground">Service Requests</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="text-4xl font-bold text-primary">850+</div>
              <p className="text-sm text-muted-foreground">Successful Matches</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="text-4xl font-bold text-primary">4.8/5</div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
            Simple Process, Great Results
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
              1
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Post Your Service Request</h3>
              <p className="text-muted-foreground">
                Clients describe their project needs, budget, and timeline. It's completely free to post.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
              2
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Providers Browse & Unlock</h3>
              <p className="text-muted-foreground">
                Service providers browse requests, and unlock client contact information for a small fee to connect directly.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
              3
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Connect & Complete</h3>
              <p className="text-muted-foreground">
                Clients and providers connect, negotiate terms, and complete the project. Both parties can leave reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center gap-6 py-24 text-center md:py-32">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="max-w-[42rem] leading-normal sm:text-xl sm:leading-8 opacity-90">
            Join thousands of clients and providers already using Rabet to grow their business
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="h-11 px-8">
              Sign Up Now
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">R</span>
                </div>
                <span className="text-lg font-bold">Rabet</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting clients with the right service providers.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">For Clients</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Post a Request
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Browse Providers
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">For Providers</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Browse Requests
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Become a Provider
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Rabet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
