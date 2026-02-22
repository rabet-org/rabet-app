# Admin Dashboard — Improvements Backlog

A prioritized, actionable checklist of fixes, improvements, and new features for the admin dashboard. Work top-to-bottom within each tier.

---

## 🔴 Tier 1 — High Priority (Broken / Missing Core Functionality)

### 1. Audit Logs — Add Search & Filters

**File:** `app/(dashboard)/admin/logs/client-page.tsx`

The logs page currently has no way to search or filter. With any real volume it is unusable.

- [x] Add a text search input (filter by admin email or target ID)
- [x] Add an action-type filter dropdown (populate from `ACTION_META` keys)
- [x] Add a performed-by filter (filter by admin ID / email)
- [x] Add a date-range filter (from / to date inputs)
- [x] Show total result count badge next to the heading
- [x] Keep all filtering client-side (data is already loaded)

---

### 2. Users — Inline Ban Reason Input

**File:** `app/(dashboard)/admin/users/client-page.tsx`

`toggleBan` currently sends a hardcoded `"Violation of platform terms."` string. The banned user gets a meaningless notification and the audit log is useless.

- [x] Remove the hardcoded reason string
- [x] Replace the `confirm()` popup with an inline confirmation panel inside the user detail dialog (same pattern as reviews delete)
- [x] Textarea for reason, required before confirming ban
- [x] Pre-typed chip suggestions: `"Spam / fake account"`, `"Abusive behavior"`, `"Payment fraud"`, `"Violation of platform terms"`, `"Suspicious activity"`
- [x] Unban action keeps a simple confirm (no reason needed)

---

### 3. Refund Management — New UI

**File:** `app/(dashboard)/admin/financials/financials-client.tsx`  
**API:** `POST /api/admin/unlocks/[id]/refund` _(verify exact endpoint)_

`process_refund` exists in ACTION_META but there is no UI to trigger it anywhere.

- [x] Audit the refund API route to confirm request shape
- [x] Add a "Refunds" tab or section inside the Financials page (below the ledger)
- [x] List unlocks that are candidates for refund (completed unlocks within a refundable window)
- [x] Each row has a "Process Refund" button
- [x] Inline confirmation panel with reason input (same chip + textarea pattern)
- [x] On success: re-fetch the ledger and show success toast

---

## 🟡 Tier 2 — Medium Priority (UX Gaps)

### 4. Financials — Date Range Filter on Transaction Ledger

**File:** `app/(dashboard)/admin/financials/financials-client.tsx`

The transaction ledger has no time scoping. It becomes a wall with real data.

- [x] Add "From" and "To" date inputs above the table
- [x] Filter `filteredTransactions` client-side by `created_at` within range
- [x] Add a quick-preset row: Today / Last 7d / Last 30d / All
- [x] Update the result count badge to reflect filtered count vs total

---

### 5. Audit Logs — Clickable Target ID → Navigate to Entity

**File:** `app/(dashboard)/admin/logs/client-page.tsx`

Log rows show `target_type` and `target_id` but there's no way to jump to the relevant entity.

- [x] Map `target_type` to a base route: `user → /admin/users`, `provider → /admin/providers`, `review → /admin/reviews`, `request → /admin/requests`
- [x] Render `target_id` as a `<Link>` that navigates to that page with the ID pre-filled in the search box (via query param `?search=<id>`)
- [x] Each listing page (`users`, `providers`, etc.) should read `?search` from `searchParams` and pre-populate the search input on mount

---

### 6. Subscription Management — New Page

**File:** `app/(dashboard)/admin/` _(new page)_  
**API:** needs audit

Users and provider detail panels show `plan_type` / `status` read-only. There's no place to manage or intervene.

- [ ] Audit existing subscription-related API routes
- [ ] Create `app/(dashboard)/admin/subscriptions/page.tsx` + `subscriptions-client.tsx`
- [ ] Table: provider name, plan type, status, started at, renews at
- [ ] Filters: plan type, status (active / expired / cancelled)
- [ ] Action per row: Cancel subscription (with reason), Change plan (if API supports it)
- [ ] Add "Subscriptions" link to `adminLinks` in `layout.tsx`

---

### 7. No Pagination — Add Count Warnings

**Files:** All listing pages (`users`, `providers`, `requests`, `financials`, `reviews`, `logs`)

All tables fetch up to 100 records and silently truncate.

- [x] Every table heading shows `Showing X of Y` where Y is the total from the API response
- [x] If results are capped (returned count === limit), show a yellow warning banner: _"Results are limited to 100. Use search/filters to narrow down."_
- [x] For `users` specifically (which does server-side fetching), add `page` / `limit` query params and basic prev/next pagination controls

---

## 🟢 Tier 3 — Nice to Have (Productivity Boosters)

### 8. Export to CSV — Financials & Users

**Files:** `financials-client.tsx`, `users/client-page.tsx`

No way to pull data into a spreadsheet.

- [ ] Add an "Export CSV" button in the toolbar of Financials (exports filtered transactions)
- [ ] Add an "Export CSV" button in Users (exports currently filtered/visible users)
- [ ] Implement as a client-side utility: `lib/export-csv.ts` with a generic `exportToCsv(rows, filename, columns)` helper
- [ ] No backend needed — serialize `filteredTransactions` / `users` directly in the browser

---

### 9. Notifications Broadcast — New UI

**File:** `app/(dashboard)/admin/` _(new page or modal)_  
**API:** `POST /api/notifications` (audit for admin broadcast support)

No way to send targeted or platform-wide notifications from the admin panel.

- [x] Audit whether the notification API supports broadcast or targeted sends from admin
- [x] Add a "Send Notification" button in the Users page toolbar (sends to a specific user)
- [x] In the user detail dialog: "Notify User" action → small form with title + message inputs
- [x] Optionally: a standalone broadcast page for platform-wide announcements

---

### 10. Bulk Actions — Applications

**File:** `app/(dashboard)/admin/applications/client-page.tsx`

Reviewing applications one-by-one is slow when there's a backlog of pending items.

- [x] Add a checkbox column to the applications table
- [x] "Select All Pending" shortcut button in the header
- [x] Bulk action toolbar appears when ≥1 rows are selected: **Approve Selected** / **Reject Selected**
- [x] Bulk reject requires a shared rejection reason input before confirming
- [x] POST to each application endpoint sequentially with a progress indicator

---

## 📋 Implementation Order

```
1. Audit Logs: search + filters          (Tier 1 — quick win)
2. Users: ban reason input               (Tier 1 — quick win, pattern already exists)
3. Financials: date range filter         (Tier 2 — quick win)
4. Audit Logs: clickable target IDs      (Tier 2 — quick win)
5. Refund Management UI                  (Tier 1 — needs API audit first)
6. Subscription Management page         (Tier 2 — needs API audit first)
7. Pagination / count warnings          (Tier 2 — spans all pages)
8. Export CSV                           (Tier 3 — self-contained utility)
9. Notifications broadcast              (Tier 3 — needs API audit)
10. Bulk actions on applications         (Tier 3 — most complex)
```

---

_Last updated: Feb 22, 2026_
