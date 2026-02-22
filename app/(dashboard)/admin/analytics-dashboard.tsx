"use client";

import { useState, useCallback, useTransition } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  BuildingsIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  LockKeyIcon,
  FileTextIcon,
  TrendUpIcon,
  ArrowUpIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

type TimePoint = { date: string; count: number };

type Analytics = {
  period: { start: string; end: string };
  users: {
    total: number;
    by_role: { client: number; provider: number; admin: number };
    new_this_period: number;
    timeline: TimePoint[];
  };
  provider_applications: {
    pending: number;
    approved: number;
    rejected: number;
  };
  requests: {
    total: number;
    by_status: { published: number; in_progress: number; completed: number };
    by_category: { category: string; count: number }[];
    timeline: TimePoint[];
  };
  unlocks: {
    total: number;
    this_period: number;
    total_revenue_egp: number;
    timeline: TimePoint[];
  };
  financials: {
    total_deposits: number;
    total_spent_on_unlocks: number;
    total_spent_on_subscriptions: number;
  };
};

// ── Date Presets ───────────────────────────────────────────────────────────────

type PresetKey = "all" | "today" | "7d" | "30d" | "90d" | "year";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "This year" },
];

function getDateRange(preset: PresetKey) {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  switch (preset) {
    case "today":
      return { start: fmt(now), end: fmt(now) };
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { start: fmt(d), end: fmt(now) };
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { start: fmt(d), end: fmt(now) };
    }
    case "90d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { start: fmt(d), end: fmt(now) };
    }
    case "year":
      return { start: `${now.getFullYear()}-01-01`, end: fmt(now) };
    default:
      return {};
  }
}

// ── Chart Configs ──────────────────────────────────────────────────────────────

const trendConfig = {
  users: { label: "New Users", color: "hsl(239 84% 67%)" },
  requests: { label: "Requests", color: "hsl(25 95% 53%)" },
  unlocks: { label: "Unlocks", color: "hsl(142 71% 45%)" },
} satisfies ChartConfig;

const userRoleConfig = {
  clients: { label: "Clients", color: "hsl(239 84% 67%)" },
  providers: { label: "Providers", color: "hsl(142 71% 45%)" },
  admins: { label: "Admins", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

const appStatusConfig = {
  approved: { label: "Approved", color: "hsl(142 71% 45%)" },
  pending: { label: "Pending", color: "hsl(38 92% 50%)" },
  rejected: { label: "Rejected", color: "hsl(0 84% 60%)" },
} satisfies ChartConfig;

const categoryConfig = {
  Requests: { label: "Requests", color: "hsl(239 84% 67%)" },
} satisfies ChartConfig;

// ── Stat Cards ─────────────────────────────────────────────────────────────────

function buildCards(a: Analytics) {
  return [
    {
      label: "Total Users",
      value: a.users.total.toLocaleString(),
      sub: `${a.users.by_role.client} clients · ${a.users.by_role.provider} providers`,
      badge:
        a.users.new_this_period > 0 ? `+${a.users.new_this_period} new` : null,
      icon: UsersIcon,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Providers",
      value: a.users.by_role.provider.toLocaleString(),
      sub: `${a.provider_applications.pending} pending applications`,
      badge: null,
      icon: BuildingsIcon,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Total Requests",
      value: a.requests.total.toLocaleString(),
      sub: `${a.requests.by_status.completed} completed`,
      badge: null,
      icon: BriefcaseIcon,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Lead Unlocks",
      value: a.unlocks.total.toLocaleString(),
      sub: `${a.unlocks.total_revenue_egp.toLocaleString()} EGP revenue`,
      badge: a.unlocks.this_period > 0 ? `+${a.unlocks.this_period}` : null,
      icon: LockKeyIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Deposits",
      value: `${a.financials.total_deposits.toLocaleString()} EGP`,
      sub: "All wallet deposits",
      badge: null,
      icon: CurrencyDollarIcon,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Subscription Revenue",
      value: `${a.financials.total_spent_on_subscriptions.toLocaleString()} EGP`,
      sub: "From active subscriptions",
      badge: null,
      icon: TrendUpIcon,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function tickDate(s: string) {
  try {
    return format(new Date(s), "MMM d");
  } catch {
    return s;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AnalyticsDashboard({
  analytics: initial,
}: {
  analytics: Analytics;
}) {
  const [analytics, setAnalytics] = useState<Analytics>(initial);
  const [activePreset, setActivePreset] = useState<PresetKey>("all");
  const [isPending, startTransition] = useTransition();

  const fetchAnalytics = useCallback(async (preset: PresetKey) => {
    const range = getDateRange(preset);
    const params = new URLSearchParams();
    if (range.start) params.set("start_date", range.start);
    if (range.end) params.set("end_date", range.end);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/analytics?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) setAnalytics(await res.json());
      } catch {}
    });
  }, []);

  const handlePreset = (p: PresetKey) => {
    setActivePreset(p);
    fetchAnalytics(p);
  };

  const cards = buildCards(analytics);

  // Merge timelines into a single date-keyed array for the triple area chart
  const mergeTimelines = () => {
    const ut = analytics.users.timeline ?? [];
    const rt = analytics.requests.timeline ?? [];
    const ult = analytics.unlocks.timeline ?? [];
    const allDates = new Set([
      ...ut.map((d) => d.date),
      ...rt.map((d) => d.date),
      ...ult.map((d) => d.date),
    ]);
    return [...allDates].sort().map((date) => ({
      date,
      users: ut.find((d) => d.date === date)?.count ?? 0,
      requests: rt.find((d) => d.date === date)?.count ?? 0,
      unlocks: ult.find((d) => d.date === date)?.count ?? 0,
    }));
  };

  const combinedTimeline = mergeTimelines();

  // Donut data
  const userRoleData = [
    {
      name: "clients",
      value: analytics.users.by_role.client,
      fill: "var(--color-clients)",
    },
    {
      name: "providers",
      value: analytics.users.by_role.provider,
      fill: "var(--color-providers)",
    },
    {
      name: "admins",
      value: analytics.users.by_role.admin,
      fill: "var(--color-admins)",
    },
  ];

  const appStatusData = [
    {
      name: "approved",
      value: analytics.provider_applications.approved,
      fill: "var(--color-approved)",
    },
    {
      name: "pending",
      value: analytics.provider_applications.pending,
      fill: "var(--color-pending)",
    },
    {
      name: "rejected",
      value: analytics.provider_applications.rejected,
      fill: "var(--color-rejected)",
    },
  ].filter((d) => d.value > 0);

  const topCategories = [...analytics.requests.by_category]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((c) => ({
      name: c.category
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      Requests: c.count,
    }));

  const completionRate =
    analytics.requests.total > 0
      ? Math.round(
          (analytics.requests.by_status.completed / analytics.requests.total) *
            100,
        )
      : 0;

  const fade = cn(
    "transition-opacity duration-300",
    isPending && "opacity-50 pointer-events-none",
  );

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant="ghost"
              onClick={() => handlePreset(p.key)}
              className={cn(
                "h-7 px-3 rounded-lg text-xs font-medium transition-all",
                activePreset === p.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground h-7">
          {isPending && (
            <span className="flex items-center gap-1.5">
              <SpinnerGapIcon className="size-3.5 animate-spin" /> Updating…
            </span>
          )}
          {activePreset !== "all" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => handlePreset("all")}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
          fade,
        )}
      >
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div
                  className={`size-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}
                >
                  <Icon className={`size-5 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-0.5">
                  {s.label}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground/60">
                    {s.sub}
                  </span>
                  {s.badge && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 gap-0.5"
                    >
                      <ArrowUpIcon className="size-2.5" />
                      {s.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Hero: Triple Area Chart ─────────────────────────────────────────── */}
      <Card className={fade}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Platform Activity Over Time</CardTitle>
              <CardDescription>
                Daily new users, requests, and lead unlocks —{" "}
                {activePreset === "all"
                  ? "last 30 days"
                  : PRESETS.find((p) => p.key === activePreset)?.label}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-indigo-500 inline-block" />{" "}
                Users
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-orange-500 inline-block" />{" "}
                Requests
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />{" "}
                Unlocks
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {combinedTimeline.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
              No activity data for this period
            </div>
          ) : (
            <ChartContainer config={trendConfig} className="h-[220px] w-full">
              <AreaChart
                data={combinedTimeline}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(239 84% 67%)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(239 84% 67%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(25 95% 53%)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(25 95% 53%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradUnlocks" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(142 71% 45%)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(142 71% 45%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickDate}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(
                    0,
                    Math.floor(combinedTimeline.length / 8) - 1,
                  )}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => tickDate(String(v))}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(239 84% 67%)"
                  strokeWidth={2}
                  fill="url(#gradUsers)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(25 95% 53%)"
                  strokeWidth={2}
                  fill="url(#gradRequests)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="unlocks"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  fill="url(#gradUnlocks)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Row: Individual Area Charts ────────────────────────────────────── */}
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", fade)}>
        {/* Users area */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UsersIcon className="size-4 text-blue-500" /> New Users
            </CardTitle>
            <CardDescription>
              {analytics.users.new_this_period} registered in period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ users: { label: "Users", color: "hsl(239 84% 67%)" } }}
              className="h-[130px] w-full"
            >
              <AreaChart
                data={analytics.users.timeline ?? []}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(239 84% 67%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(239 84% 67%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickDate}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(
                    0,
                    Math.floor((analytics.users.timeline ?? []).length / 4) - 1,
                  )}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => tickDate(String(v))}
                      hideLabel={false}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Users"
                  stroke="hsl(239 84% 67%)"
                  strokeWidth={2}
                  fill="url(#g1)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Requests area */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BriefcaseIcon className="size-4 text-orange-500" /> Requests
              Created
            </CardTitle>
            <CardDescription>
              {completionRate}% completion rate · {analytics.requests.total}{" "}
              total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                requests: { label: "Requests", color: "hsl(25 95% 53%)" },
              }}
              className="h-[130px] w-full"
            >
              <AreaChart
                data={analytics.requests.timeline ?? []}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(25 95% 53%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(25 95% 53%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickDate}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(
                    0,
                    Math.floor((analytics.requests.timeline ?? []).length / 4) -
                      1,
                  )}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => tickDate(String(v))}
                      hideLabel={false}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Requests"
                  stroke="hsl(25 95% 53%)"
                  strokeWidth={2}
                  fill="url(#g2)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Unlocks area */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <LockKeyIcon className="size-4 text-emerald-500" /> Lead Unlocks
            </CardTitle>
            <CardDescription>
              {analytics.unlocks.total_revenue_egp.toLocaleString()} EGP total
              revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                unlocks: { label: "Unlocks", color: "hsl(142 71% 45%)" },
              }}
              className="h-[130px] w-full"
            >
              <AreaChart
                data={analytics.unlocks.timeline ?? []}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(142 71% 45%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(142 71% 45%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickDate}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(
                    0,
                    Math.floor((analytics.unlocks.timeline ?? []).length / 4) -
                      1,
                  )}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => tickDate(String(v))}
                      hideLabel={false}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Unlocks"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  fill="url(#g3)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row: Donuts + Category Bar ─────────────────────────────────────── */}
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", fade)}>
        {/* User Roles Donut */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UsersIcon className="size-4 text-blue-500" /> User Roles
            </CardTitle>
            <CardDescription>{analytics.users.total} total</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={userRoleConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <Pie
                  data={userRoleData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {userRoleData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Applications Donut */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileTextIcon className="size-4 text-purple-500" /> Applications
              {analytics.provider_applications.pending > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 text-amber-600 border-amber-500/30 bg-amber-500/10 ml-auto"
                >
                  {analytics.provider_applications.pending} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>By review status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={appStatusConfig}
              className="mx-auto aspect-square max-h-[200px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <Pie
                  data={
                    appStatusData.length
                      ? appStatusData
                      : [{ name: "none", value: 1, fill: "hsl(var(--muted))" }]
                  }
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {appStatusData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Categories Bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold">
              Top Request Categories
            </CardTitle>
            <CardDescription>Most active service categories</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            {topCategories.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <ChartContainer
                config={categoryConfig}
                className="h-[200px] w-full"
              >
                <BarChart
                  data={topCategories}
                  layout="vertical"
                  margin={{ left: 0, right: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={90}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={false}
                  />
                  <Bar
                    dataKey="Requests"
                    fill="var(--color-Requests)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue Banner ────────────────────────────────────────────────── */}
      <Card
        className={cn(
          "bg-linear-to-r from-indigo-500/10 to-purple-500/5 border-indigo-500/20",
          fade,
        )}
      >
        <CardContent className="p-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
              Total Lead Unlock Revenue
            </p>
            <p className="text-4xl font-bold tracking-tight">
              {analytics.unlocks.total_revenue_egp.toLocaleString()}{" "}
              <span className="text-xl text-muted-foreground font-normal">
                EGP
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {analytics.unlocks.total.toLocaleString()} completed unlocks
              {analytics.unlocks.this_period > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {" "}
                  · {analytics.unlocks.this_period} in period
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-8">
            {[
              {
                val: analytics.provider_applications.approved,
                label: "Approved Providers",
              },
              {
                val: analytics.provider_applications.pending,
                label: "Pending Apps",
                cls: "text-amber-500",
              },
              {
                val: analytics.requests.by_status.completed,
                label: "Completed Requests",
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={cn("text-2xl font-bold", item.cls)}>{item.val}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
