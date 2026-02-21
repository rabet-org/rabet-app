# Rabet Platform - API Design

## Overview

RESTful API for the Rabet marketplace platform. All endpoints follow REST conventions and return JSON. Built on top of the normalized ERD (17 tables).

**Base URL:** `https://api.rabet.com/v1`  
**Authentication:** JWT Bearer tokens (except public endpoints)  
**Content-Type:** `application/json`

---

## Standard Response Envelope

**Success (paginated):**

```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "total_pages": 5 }
}
```

**Error:**

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient wallet balance to unlock this lead",
    "details": { "required": 50.0, "available": 20.0 }
  }
}
```

**HTTP Status Codes:**

| Code  | Meaning                              |
| ----- | ------------------------------------ |
| `200` | Success                              |
| `201` | Resource created                     |
| `204` | Success, no body                     |
| `400` | Invalid request / validation error   |
| `401` | Missing or invalid token             |
| `403` | Insufficient permissions             |
| `404` | Resource not found                   |
| `409` | Conflict (duplicate, already exists) |
| `422` | Business rule violation              |
| `429` | Rate limit exceeded                  |
| `500` | Internal server error                |

---

## Rate Limiting

| Endpoint Group          | Limit                 |
| ----------------------- | --------------------- |
| Auth endpoints          | 10 req/min per IP     |
| Public read endpoints   | 100 req/min per IP    |
| Authenticated endpoints | 200 req/min per user  |
| Admin endpoints         | 500 req/min per admin |

---

## 1. Authentication & Sessions

### 1.1 Register

```http
POST /auth/register
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "phone": "+201234567890"
}
```

**Response `201`:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "email_verified": false,
    "profile": { "full_name": "John Doe", "phone": "+201234567890" },
    "created_at": "2025-12-06T10:00:00Z"
  },
  "message": "Verification email sent"
}
```

> Creates `USER`, `USER_AUTH`, and `USER_PROFILE` records atomically.

---

### 1.2 Login

```http
POST /auth/login
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response `200`:**

```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "Bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "email_verified": true,
    "profile": { "full_name": "John Doe", "avatar_url": null }
  }
}
```

---

### 1.3 OAuth Login

```http
POST /auth/oauth/{provider}
```

**Path params:** `provider` = `google` | `facebook` | `apple`

**Request:**

```json
{ "token": "oauth_provider_token" }
```

**Response `200`:** Same shape as Login.

> Creates `USER_AUTH` with `auth_provider` set, `password_hash` = null.

---

### 1.4 Refresh Token

```http
POST /auth/refresh
```

**Request:**

```json
{ "refresh_token": "jwt_refresh_token" }
```

**Response `200`:**

```json
{
  "access_token": "new_jwt_access_token",
  "expires_in": 1800
}
```

---

### 1.5 Verify Email

```http
POST /auth/verify-email
```

**Request:**

```json
{ "token": "email_verification_token" }
```

**Response `200`:**

```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email_verified": true,
    "email_verified_at": "2025-12-06T10:00:00Z"
  }
}
```

---

### 1.6 Request Password Reset

```http
POST /auth/password-reset/request
```

**Request:**

```json
{ "email": "user@example.com" }
```

**Response `200`:**

```json
{ "message": "Password reset email sent" }
```

---

### 1.7 Confirm Password Reset

```http
POST /auth/password-reset/confirm
```

**Request:**

```json
{
  "token": "password_reset_token",
  "new_password": "NewSecurePass123"
}
```

**Response `200`:**

```json
{ "message": "Password reset successfully" }
```

---

### 1.8 Logout

```http
POST /auth/logout
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{ "message": "Logged out successfully" }
```

---

### 1.9 Logout All Sessions

```http
POST /auth/logout-all
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{ "message": "All sessions revoked", "sessions_revoked": 3 }
```

---

## 2. User Profile

### 2.1 Get Current User

```http
GET /users/me
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "client",
  "email_verified": true,
  "is_active": true,
  "last_login_at": "2025-12-06T09:00:00Z",
  "created_at": "2025-12-01T10:00:00Z",
  "profile": {
    "full_name": "John Doe",
    "phone": "+201234567890",
    "avatar_url": "https://cdn.rabet.com/avatars/user.jpg"
  }
}
```

---

### 2.2 Update Current User Profile

```http
PATCH /users/me/profile
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "full_name": "John Updated Doe",
  "phone": "+201234567891",
  "avatar_url": "https://cdn.rabet.com/avatars/new.jpg"
}
```

**Response `200`:** Updated user object (same shape as 2.1).

> Updates `USER_PROFILE` only. Email changes require a separate verification flow.

---

## 3. Categories

### 3.1 List Categories

```http
GET /categories
```

**Query params:** `is_active=true`

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "web-design",
      "name": "Web Design",
      "icon": "globe",
      "is_active": true
    },
    {
      "id": "uuid",
      "slug": "branding",
      "name": "Branding",
      "icon": "tag",
      "is_active": true
    }
  ]
}
```

---

### 3.2 Get Category

```http
GET /categories/{category_id}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "slug": "web-design",
  "name": "Web Design",
  "description": "Custom website design and development services",
  "icon": "globe",
  "is_active": true
}
```

---

## 4. Provider Applications

### 4.1 Submit Application

```http
POST /provider-applications
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "description": "Full-service creative agency with 5 years of experience in digital marketing and web design.",
  "portfolio_url": "https://creativeagency.com",
  "verification_docs": {
    "business_license_url": "https://cdn.rabet.com/docs/license.pdf",
    "tax_id": "123456789",
    "portfolio_samples": ["https://cdn.rabet.com/samples/1.jpg"]
  }
}
```

> `full_name` is read from the authenticated user's `USER_PROFILE`.

**Response `201`:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "applicant": { "full_name": "John Doe", "email": "john@example.com" },
  "application_status": "pending",
  "created_at": "2025-12-06T10:00:00Z",
  "message": "Application submitted. You will be notified once reviewed."
}
```

**Errors:** `409` if user already has an application or is already a provider.

---

### 4.2 Get My Application

```http
GET /provider-applications/me
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "description": "...",
  "portfolio_url": "https://creativeagency.com",
  "application_status": "pending",
  "rejection_reason": null,
  "created_at": "2025-12-06T10:00:00Z",
  "updated_at": "2025-12-06T10:00:00Z"
}
```

---

### 4.3 Update My Application

```http
PATCH /provider-applications/me
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "description": "Updated description...",
  "portfolio_url": "https://newurl.com",
  "verification_docs": {
    "business_license_url": "https://cdn.rabet.com/docs/new.pdf"
  }
}
```

**Response `200`:** Updated application object.

**Error:** `403` if application is currently under review or already approved.

---

## 5. Provider Profiles

### 5.1 Get Provider Profile (Public)

```http
GET /providers/{provider_id}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "full_name": "John Doe",
  "description": "Full-service creative agency...",
  "portfolio_url": "https://creativeagency.com",
  "services": [
    { "category_id": "uuid", "slug": "web-design", "name": "Web Design" },
    { "category_id": "uuid", "slug": "branding", "name": "Branding" }
  ],
  "is_verified": true,
  "verified_at": "2025-12-05T10:00:00Z",
  "average_rating": 4.5,
  "total_reviews": 23,
  "total_unlocks": 145,
  "created_at": "2025-11-01T10:00:00Z"
}
```

> `business_name`, `provider_type` from `PROVIDER_APPLICATION`; `full_name` from `USER_PROFILE`; `services` from `PROVIDER_SERVICE` + `CATEGORY`.

---

### 5.2 Update My Provider Profile

```http
PATCH /providers/me
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "description": "Updated description...",
  "portfolio_url": "https://newurl.com",
  "service_category_ids": ["uuid-web-design", "uuid-branding", "uuid-seo"]
}
```

**Response `200`:** Updated provider profile (same shape as 5.1).

> Replaces `PROVIDER_SERVICE` entries for this provider.

---

### 5.3 List Providers (Public)

```http
GET /providers
```

**Query params:**

| Param           | Type    | Description                  |
| --------------- | ------- | ---------------------------- |
| `category_slug` | string  | Filter by service category   |
| `is_verified`   | boolean | Only verified providers      |
| `min_rating`    | number  | Minimum average rating (1–5) |
| `page`          | integer | Page number                  |
| `limit`         | integer | Max 100                      |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "provider_type": "agency",
      "business_name": "Creative Agency Inc.",
      "full_name": "John Doe",
      "services": [{ "slug": "web-design", "name": "Web Design" }],
      "is_verified": true,
      "average_rating": 4.5,
      "total_reviews": 23
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "total_pages": 8 }
}
```

---

## 6. Wallet & Financial Operations

### 6.1 Get Wallet

```http
GET /providers/me/wallet
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "provider_id": "uuid",
  "balance": 500.0,
  "currency": "EGP",
  "total_spent": 1200.5,
  "total_deposited": 1700.5,
  "updated_at": "2025-12-06T10:00:00Z"
}
```

> `total_spent` and `total_deposited` are computed aggregates from `WALLET_TRANSACTION`, not stored.

---

### 6.2 Get Wallet Transactions

```http
GET /providers/me/wallet/transactions
Authorization: Bearer {access_token}
```

**Query params:**

| Param            | Values                                           |
| ---------------- | ------------------------------------------------ |
| `type`           | `deposit` \| `debit` \| `refund` \| `adjustment` |
| `reference_type` | `lead_unlock` \| `subscription` \| `top_up`      |
| `start_date`     | ISO 8601                                         |
| `end_date`       | ISO 8601                                         |
| `page`           | integer                                          |
| `limit`          | integer                                          |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 500.0,
      "balance_before": 0.0,
      "balance_after": 500.0,
      "reference_type": "top_up",
      "description": "Wallet top-up via Paymob",
      "metadata": {
        "payment_provider": "paymob",
        "external_transaction_id": "paymob_txn_123",
        "card_last_four": "4242",
        "card_brand": "visa"
      },
      "created_at": "2025-12-06T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "debit",
      "amount": -50.0,
      "balance_before": 500.0,
      "balance_after": 450.0,
      "reference_type": "lead_unlock",
      "reference_id": "unlock_uuid",
      "description": "Lead unlock: Web Design Request",
      "created_at": "2025-12-06T11:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "total_pages": 3 }
}
```

---

### 6.3 Initiate Deposit

```http
POST /providers/me/wallet/deposit
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "amount": 500.0,
  "payment_provider": "paymob",
  "return_url": "https://app.rabet.com/wallet/success"
}
```

**Response `200`:**

```json
{
  "payment_url": "https://paymob.com/payment/session_123",
  "session_id": "session_123",
  "amount": 500.0,
  "currency": "EGP",
  "expires_at": "2025-12-06T11:00:00Z"
}
```

---

### 6.4 Payment Webhook

```http
POST /webhooks/payments/{provider}
```

**Path params:** `provider` = `paymob` | `stripe`

**Headers:** `X-Webhook-Signature: hmac_signature`

**Response `200`:** Processes confirmation, creates `WALLET_TRANSACTION` of type `deposit`, updates `PROVIDER_WALLET.balance`.

---

## 7. Service Requests

### 7.1 Create Request

```http
POST /requests
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "title": "Need a modern website redesign",
  "description": "Looking for a creative agency to redesign our e-commerce website with modern UI/UX...",
  "category_id": "uuid",
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "deadline": "2025-12-20T00:00:00Z",
  "status": "draft"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Need a modern website redesign",
  "category": { "id": "uuid", "slug": "web-design", "name": "Web Design" },
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "status": "draft",
  "unlock_fee": 50.0,
  "deadline": "2025-12-20T00:00:00Z",
  "created_at": "2025-12-06T10:00:00Z"
}
```

**Error:** `403` if email not verified when publishing.

---

### 7.2 Get Request Details

```http
GET /requests/{request_id}
Authorization: Bearer {access_token}  (optional)
```

**Response — Anonymized (provider, not yet unlocked):**

```json
{
  "id": "uuid",
  "title": "Need a modern website redesign",
  "description": "Looking for a creative agency...",
  "category": { "slug": "web-design", "name": "Web Design" },
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "status": "published",
  "deadline": "2025-12-20T00:00:00Z",
  "unlock_fee": 50.0,
  "unlock_count": 3,
  "is_unlocked": false,
  "created_at": "2025-12-06T10:00:00Z"
}
```

**Response — Unlocked (provider who paid):**

```json
{
  "id": "uuid",
  "title": "Need a modern website redesign",
  "category": { "slug": "web-design", "name": "Web Design" },
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "status": "published",
  "is_unlocked": true,
  "unlocked_at": "2025-12-06T11:00:00Z",
  "client": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+201234567890"
  }
}
```

> `client` fields sourced from `USER_PROFILE` — only exposed after confirmed `LEAD_UNLOCK`.

---

### 7.3 List Requests (Public)

```http
GET /requests
```

**Query params:**

| Param           | Values                                      |
| --------------- | ------------------------------------------- |
| `category_slug` | e.g. `web-design`                           |
| `status`        | `published` \| `in_progress` \| `completed` |
| `budget_min`    | number (EGP)                                |
| `budget_max`    | number (EGP)                                |
| `location`      | string                                      |
| `search`        | keyword search in title/description         |
| `sort`          | `created_at` \| `deadline` \| `unlock_fee`  |
| `order`         | `asc` \| `desc`                             |
| `page`          | integer                                     |
| `limit`         | integer                                     |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Need a modern website redesign",
      "category": { "slug": "web-design", "name": "Web Design" },
      "budget_range": "5000-10000",
      "location": "Cairo, Egypt",
      "status": "published",
      "unlock_fee": 50.0,
      "unlock_count": 3,
      "deadline": "2025-12-20T00:00:00Z",
      "created_at": "2025-12-06T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 234, "total_pages": 12 }
}
```

---

### 7.4 Get My Requests (Client)

```http
GET /users/me/requests
Authorization: Bearer {access_token}
```

**Query params:** `status`, `page`, `limit`

**Response `200`:** Paginated list with full client-side details (no anonymization).

---

### 7.5 Update Request

```http
PATCH /requests/{request_id}
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category_id": "uuid",
  "status": "published"
}
```

**Response `200`:** Updated request object.

**Error:** `403` if request has been unlocked by any provider (cannot edit).

---

### 7.6 Delete Request

```http
DELETE /requests/{request_id}
Authorization: Bearer {access_token}
```

**Response `204`**

**Error:** `422` if any `LEAD_UNLOCK` exists for this request.

---

## 8. Lead Unlocks

### 8.1 Unlock a Lead

```http
POST /requests/{request_id}/unlock
Authorization: Bearer {access_token}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "request_id": "uuid",
  "provider_id": "uuid",
  "unlock_fee": 50.0,
  "status": "completed",
  "unlocked_at": "2025-12-06T11:00:00Z",
  "completed_at": "2025-12-06T11:00:00Z",
  "wallet_balance_after": 450.0,
  "request": {
    "id": "uuid",
    "title": "Need a modern website redesign",
    "client": {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+201234567890"
    }
  }
}
```

> `wallet_balance_after` is sourced from the linked `WALLET_TRANSACTION`, not stored on `LEAD_UNLOCK`.

**Errors:**

- `400` — Insufficient wallet balance
- `403` — Email not verified, or request not published
- `409` — Already unlocked by this provider

---

### 8.2 Get My Unlocked Leads (Provider)

```http
GET /providers/me/unlocks
Authorization: Bearer {access_token}
```

**Query params:** `status`, `start_date`, `end_date`, `page`, `limit`

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "unlock_fee": 50.0,
      "status": "completed",
      "unlocked_at": "2025-12-06T11:00:00Z",
      "request": {
        "id": "uuid",
        "title": "Need a modern website redesign",
        "category": { "slug": "web-design", "name": "Web Design" },
        "budget_range": "5000-10000",
        "client": {
          "full_name": "John Doe",
          "email": "john@example.com",
          "phone": "+201234567890"
        }
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 145, "total_pages": 8 }
}
```

---

### 8.3 Get Unlocks on My Request (Client)

```http
GET /requests/{request_id}/unlocks
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "unlocked_at": "2025-12-06T11:00:00Z",
      "provider": {
        "id": "uuid",
        "business_name": "Creative Agency Inc.",
        "is_verified": true,
        "average_rating": 4.5,
        "total_reviews": 23
      }
    }
  ],
  "total": 5
}
```

---

## 9. Reviews & Ratings

### 9.1 Create Review

```http
POST /requests/{request_id}/reviews
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "provider_id": "uuid",
  "rating": 5,
  "comment": "Excellent work! Very professional and delivered on time."
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "request_id": "uuid",
  "provider_id": "uuid",
  "rating": 5,
  "comment": "Excellent work!...",
  "created_at": "2025-12-06T12:00:00Z",
  "updated_at": "2025-12-06T12:00:00Z"
}
```

**Errors:**

- `403` — No completed `LEAD_UNLOCK` for this `(request_id, provider_id)` pair
- `409` — Review already exists for this pair

---

### 9.2 Update Review

```http
PATCH /reviews/{review_id}
Authorization: Bearer {access_token}
```

**Request:**

```json
{ "rating": 4, "comment": "Updated comment after reflection." }
```

**Response `200`:** Updated review object.

**Error:** `403` if more than 30 days since `created_at`.

---

### 9.3 Delete Review

```http
DELETE /reviews/{review_id}
Authorization: Bearer {access_token}
```

**Response `204`**

**Error:** `403` if more than 30 days since `created_at`.

> Performs a soft delete — sets `deleted_at` on the `REVIEW` record.

---

### 9.4 Get Provider Reviews (Public)

```http
GET /providers/{provider_id}/reviews
```

**Query params:** `min_rating`, `page`, `limit`

**Response `200`:**

```json
{
  "summary": {
    "average_rating": 4.5,
    "total_reviews": 23,
    "rating_distribution": { "5": 15, "4": 5, "3": 2, "2": 1, "1": 0 }
  },
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excellent work!",
      "client": {
        "full_name": "Jane Doe",
        "avatar_url": "https://cdn.rabet.com/avatars/jane.jpg"
      },
      "request": {
        "title": "Website redesign",
        "category": { "name": "Web Design" }
      },
      "created_at": "2025-12-06T12:00:00Z",
      "updated_at": "2025-12-06T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 23, "total_pages": 2 }
}
```

> Excludes soft-deleted reviews (`deleted_at IS NOT NULL`).

---

## 10. Subscriptions

### 10.1 Get Available Plans

```http
GET /subscriptions/plans
```

**Response `200`:**

```json
{
  "plans": [
    {
      "plan_type": "free",
      "price_monthly": 0,
      "price_annual": 0,
      "free_unlocks": 0,
      "priority_listing": false
    },
    {
      "plan_type": "basic",
      "price_monthly": 299,
      "price_annual": 2990,
      "free_unlocks": 5,
      "priority_listing": false
    },
    {
      "plan_type": "premium",
      "price_monthly": 799,
      "price_annual": 7990,
      "free_unlocks": 20,
      "priority_listing": true
    }
  ]
}
```

---

### 10.2 Subscribe / Upgrade / Downgrade

```http
POST /providers/me/subscription
Authorization: Bearer {access_token}
```

**Request:**

```json
{
  "plan_type": "premium",
  "billing_cycle": "monthly"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "plan_type": "premium",
  "billing_cycle": "monthly",
  "free_unlocks_remaining": 20,
  "priority_listing": true,
  "starts_at": "2025-12-06T12:00:00Z",
  "expires_at": "2026-01-06T12:00:00Z",
  "status": "active",
  "history_event": { "event_type": "created", "amount_charged": 799.0 }
}
```

> Creates a `SUBSCRIPTION_HISTORY` record of type `created` or `upgraded`/`downgraded`. Charges wallet and creates a `WALLET_TRANSACTION`.

---

### 10.3 Get My Subscription

```http
GET /providers/me/subscription
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "id": "uuid",
  "plan_type": "premium",
  "billing_cycle": "monthly",
  "free_unlocks_remaining": 15,
  "priority_listing": true,
  "starts_at": "2025-12-06T12:00:00Z",
  "expires_at": "2026-01-06T12:00:00Z",
  "status": "active",
  "cancelled_at": null
}
```

---

### 10.4 Cancel Subscription

```http
DELETE /providers/me/subscription
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "message": "Subscription cancelled. Access continues until current period ends.",
  "expires_at": "2026-01-06T12:00:00Z",
  "status": "cancelled"
}
```

> Creates a `SUBSCRIPTION_HISTORY` record of type `cancelled`.

---

### 10.5 Get Subscription History

```http
GET /providers/me/subscription/history
Authorization: Bearer {access_token}
```

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "created",
      "plan_from": null,
      "plan_to": "premium",
      "amount_charged": 799.0,
      "created_at": "2025-12-06T12:00:00Z"
    },
    {
      "id": "uuid",
      "event_type": "renewed",
      "plan_from": "premium",
      "plan_to": "premium",
      "amount_charged": 799.0,
      "created_at": "2026-01-06T12:00:00Z"
    }
  ]
}
```

---

## 11. Notifications

### 11.1 Get My Notifications

```http
GET /users/me/notifications
Authorization: Bearer {access_token}
```

**Query params:**

| Param     | Values                                                                                                                                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `email_verified` \| `application_approved` \| `application_rejected` \| `request_unlocked` \| `low_wallet_balance` \| `subscription_renewed` \| `subscription_expiring` \| `new_review_received` \| `request_status_changed` \| `refund_processed` |
| `is_read` | `true` \| `false`                                                                                                                                                                                                                                  |
| `page`    | integer                                                                                                                                                                                                                                            |
| `limit`   | integer                                                                                                                                                                                                                                            |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "request_unlocked",
      "title": "New unlock on your request",
      "message": "Creative Agency Inc. unlocked your request 'Website redesign'",
      "is_read": false,
      "metadata": { "request_id": "uuid", "provider_id": "uuid" },
      "created_at": "2025-12-06T11:00:00Z"
    }
  ],
  "unread_count": 5,
  "pagination": { "page": 1, "limit": 20, "total": 45, "total_pages": 3 }
}
```

---

### 11.2 Mark Notification as Read

```http
PATCH /notifications/{notification_id}/read
Authorization: Bearer {access_token}
```

**Response `200`:** `{ "id": "uuid", "is_read": true }`

---

### 11.3 Mark All as Read

```http
POST /notifications/mark-all-read
Authorization: Bearer {access_token}
```

**Response `200`:** `{ "message": "All notifications marked as read", "count": 5 }`

---

### 11.4 Delete Notification

```http
DELETE /notifications/{notification_id}
Authorization: Bearer {access_token}
```

**Response `204`**

---

## 12. Admin Endpoints

> All admin endpoints require `role = admin` in the JWT. Returns `403` otherwise.

### 12.1 List Provider Applications

```http
GET /admin/provider-applications
Authorization: Bearer {admin_access_token}
```

**Query params:** `status`, `provider_type`, `page`, `limit`

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "provider_type": "agency",
      "business_name": "Creative Agency Inc.",
      "application_status": "pending",
      "created_at": "2025-12-06T10:00:00Z",
      "applicant": {
        "id": "uuid",
        "email": "john@example.com",
        "full_name": "John Doe",
        "phone": "+201234567890"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

---

### 12.2 Approve Application

```http
POST /admin/provider-applications/{application_id}/approve
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{ "notes": "All documents verified. Approved." }
```

**Response `200`:**

```json
{
  "application_id": "uuid",
  "application_status": "approved",
  "provider_profile_id": "uuid",
  "provider_wallet_id": "uuid",
  "approved_at": "2025-12-06T12:00:00Z",
  "message": "Application approved. Profile and wallet created."
}
```

> Atomic transaction: update `PROVIDER_APPLICATION` → create `PROVIDER_PROFILE` → create `PROVIDER_WALLET` → update `USER.role` = `provider` → log `ADMIN_LOG`.

---

### 12.3 Reject Application

```http
POST /admin/provider-applications/{application_id}/reject
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{
  "rejection_reason": "Incomplete verification documents. Please resubmit with a valid business license."
}
```

**Response `200`:**

```json
{
  "application_id": "uuid",
  "application_status": "rejected",
  "rejection_reason": "Incomplete verification documents...",
  "rejected_at": "2025-12-06T12:00:00Z"
}
```

---

### 12.4 Verify Provider

```http
POST /admin/providers/{provider_id}/verify
Authorization: Bearer {admin_access_token}
```

**Response `200`:**

```json
{
  "provider_id": "uuid",
  "is_verified": true,
  "verified_at": "2025-12-06T12:00:00Z"
}
```

---

### 12.5 Unverify Provider

```http
DELETE /admin/providers/{provider_id}/verify
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{ "reason": "Fraudulent activity detected" }
```

**Response `200`:** `{ "provider_id": "uuid", "is_verified": false }`

---

### 12.6 Block / Unblock User

```http
POST /admin/users/{user_id}/block
DELETE /admin/users/{user_id}/block
Authorization: Bearer {admin_access_token}
```

**Block request:**

```json
{ "reason": "Spam activity" }
```

**Response `200`:** `{ "user_id": "uuid", "is_blocked": true }`

---

### 12.7 Moderate Request

```http
PATCH /admin/requests/{request_id}/moderate
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{
  "status": "cancelled",
  "reason": "Violates platform policies — offensive content"
}
```

**Response `200`:** Updated request object.

---

### 12.8 Remove Review

```http
DELETE /admin/reviews/{review_id}
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{ "reason": "Inappropriate content" }
```

**Response `204`**

> Performs soft delete — sets `deleted_at` on the `REVIEW` record.

---

### 12.9 Refund Unlock

```http
POST /admin/unlocks/{unlock_id}/refund
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{ "reason": "Duplicate unlock due to system error" }
```

**Response `200`:**

```json
{
  "unlock_id": "uuid",
  "status": "refunded",
  "refunded_at": "2025-12-06T13:00:00Z",
  "refund_amount": 50.0,
  "wallet_transaction_id": "uuid"
}
```

> Creates a credit `WALLET_TRANSACTION` of type `refund`, updates `LEAD_UNLOCK.status` = `refunded`, updates `PROVIDER_WALLET.balance`.

---

### 12.10 Manual Wallet Adjustment

```http
POST /admin/providers/{provider_id}/wallet/adjust
Authorization: Bearer {admin_access_token}
```

**Request:**

```json
{
  "amount": 100.0,
  "reason": "Compensation for service downtime"
}
```

**Response `200`:**

```json
{
  "transaction_id": "uuid",
  "type": "adjustment",
  "amount": 100.0,
  "balance_before": 450.0,
  "balance_after": 550.0
}
```

---

### 12.11 Manage Categories

```http
POST /admin/categories
PATCH /admin/categories/{category_id}
DELETE /admin/categories/{category_id}
Authorization: Bearer {admin_access_token}
```

**Create / Update request:**

```json
{
  "slug": "video-production",
  "name": "Video Production",
  "description": "Video filming, editing, and post-production services",
  "icon": "video",
  "is_active": true
}
```

**Response `201` / `200`:** Category object.

---

### 12.12 Get Admin Logs

```http
GET /admin/logs
Authorization: Bearer {admin_access_token}
```

**Query params:**

| Param         | Values                                                                                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin_id`    | UUID                                                                                                                                                                                                  |
| `action_type` | `approve_provider` \| `reject_provider` \| `verify_provider` \| `unverify_provider` \| `moderate_request` \| `remove_review` \| `process_refund` \| `block_user` \| `unblock_user` \| `adjust_wallet` |
| `target_type` | `user` \| `provider` \| `request` \| `review` \| `wallet`                                                                                                                                             |
| `start_date`  | ISO 8601                                                                                                                                                                                              |
| `end_date`    | ISO 8601                                                                                                                                                                                              |
| `page`        | integer                                                                                                                                                                                               |
| `limit`       | integer                                                                                                                                                                                               |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "admin": { "id": "uuid", "full_name": "Admin User" },
      "action_type": "approve_provider",
      "target_type": "provider",
      "target_id": "application_uuid",
      "details": {
        "business_name": "Creative Agency Inc.",
        "notes": "All docs verified"
      },
      "created_at": "2025-12-06T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 234, "total_pages": 5 }
}
```

---

### 12.13 Get Platform Analytics

```http
GET /admin/analytics
Authorization: Bearer {admin_access_token}
```

**Query params:** `start_date`, `end_date`

**Response `200`:**

```json
{
  "period": { "start": "2025-12-01T00:00:00Z", "end": "2025-12-06T00:00:00Z" },
  "users": {
    "total": 1250,
    "by_role": { "client": 890, "provider": 360, "admin": 5 },
    "new_this_period": 45
  },
  "provider_applications": {
    "pending": 23,
    "approved": 187,
    "rejected": 45
  },
  "requests": {
    "total": 567,
    "by_status": { "published": 234, "in_progress": 123, "completed": 210 },
    "by_category": [
      { "category": "web-design", "count": 120 },
      { "category": "branding", "count": 89 }
    ]
  },
  "unlocks": {
    "total": 1890,
    "this_period": 145,
    "total_revenue_egp": 94500.0
  },
  "financials": {
    "total_deposits": 250000.0,
    "total_spent_on_unlocks": 94500.0,
    "total_spent_on_subscriptions": 45000.0
  }
}
```
