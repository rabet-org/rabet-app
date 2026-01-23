# Rabet Platform - API Design

## Overview

RESTful API design for the Rabet marketplace platform, strictly based on the ERD entities and business rules. All endpoints follow REST conventions and return JSON responses.

**Base URL:** `https://api.rabet.com/v1`

**Authentication:** JWT Bearer tokens (except public endpoints)

---

## 1. Authentication & User Management

### 1.1 Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+201234567890"
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client",
    "email_verified": false,
    "created_at": "2025-12-06T10:00:00Z"
  },
  "message": "Verification email sent"
}
```

**Note:** All new users start with `client` role. To become a provider (agency), they must submit a provider application.

---

### 1.2 Login (Local)

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "Bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client",
    "email_verified": true
  }
}
```

---

### 1.3 OAuth Login

```http
POST /auth/oauth/{provider}
```

**Path Parameters:**

- `provider`: `google` | `facebook` | `apple`

**Request Body:**

```json
{
  "token": "oauth_provider_token"
}
```

**Response:** `200 OK` (same as login)

---

### 1.4 Refresh Token

```http
POST /auth/refresh
```

**Request Body:**

```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response:** `200 OK`

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

**Request Body:**

```json
{
  "token": "email_verification_token"
}
```

**Response:** `200 OK`

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

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
  "message": "Password reset email sent"
}
```

---

### 1.7 Reset Password

```http
POST /auth/password-reset/confirm
```

**Request Body:**

```json
{
  "token": "password_reset_token",
  "new_password": "newSecurePassword123"
}
```

**Response:** `200 OK`

```json
{
  "message": "Password reset successfully"
}
```

---

### 1.8 Logout

```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

### 1.9 Logout All Sessions

```http
POST /auth/logout-all
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "message": "All sessions logged out successfully",
  "sessions_revoked": 3
}
```

---

### 1.10 Get Current User

```http
GET /users/me
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+201234567890",
  "avatar_url": "https://cdn.rabet.com/avatars/user.jpg",
  "role": "client",
  "auth_provider": "local",
  "email_verified": true,
  "is_active": true,
  "last_login_at": "2025-12-06T09:00:00Z",
  "created_at": "2025-12-01T10:00:00Z"
}
```

---

### 1.11 Update User Profile

```http
PATCH /users/me
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "full_name": "John Updated Doe",
  "phone": "+201234567891",
  "avatar_url": "https://cdn.rabet.com/avatars/new.jpg"
}
```

**Response:** `200 OK` (updated user object)

---

## 2. Provider Application & Profile Management

### 2.1 Submit Provider Application

```http
POST /provider-applications
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.", // required for agencies
  "full_name": "John Doe",
  "description": "Full-service creative agency with 5 years experience",
  "services": ["branding", "web-design", "marketing"],
  "portfolio_url": "https://creativeagency.com",
  "verification_docs": {
    "business_license_url": "https://cdn.rabet.com/docs/license.pdf",
    "tax_id": "123456789",
    "portfolio_samples": ["url1", "url2"]
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "full_name": "John Doe",
  "description": "Full-service creative agency...",
  "services": ["branding", "web-design", "marketing"],
  "portfolio_url": "https://creativeagency.com",
  "application_status": "pending",
  "created_at": "2025-12-06T10:00:00Z",
  "message": "Application submitted successfully. You will be notified once reviewed."
}
```

**Error:** `409 Conflict` if user already has an application or is already a provider

---

### 2.2 Get My Provider Application

```http
GET /provider-applications/me
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "application_status": "pending",
  "created_at": "2025-12-06T10:00:00Z",
  "updated_at": "2025-12-06T10:00:00Z"
}
```

**Response:** `404 Not Found` if no application exists

---

### 2.3 Update Provider Application

```http
PATCH /provider-applications/me
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "description": "Updated description",
  "services": ["branding", "web-design", "marketing", "seo"],
  "portfolio_url": "https://newurl.com"
}
```

**Response:** `200 OK` (updated application object)

**Error:** `403 Forbidden` if application is already approved or under review

---

### 2.4 Get Provider Profile

```http
GET /providers/{provider_id}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "provider_type": "agency",
  "business_name": "Creative Agency Inc.",
  "full_name": "John Doe",
  "description": "Full-service creative agency",
  "services": ["branding", "web-design", "marketing"],
  "portfolio_url": "https://creativeagency.com",
  "is_verified": true,
  "verified_at": "2025-12-05T10:00:00Z",
  "average_rating": 4.5,
  "total_reviews": 23,
  "total_unlocks": 145,
  "created_at": "2025-11-01T10:00:00Z"
}
```

---

### 2.5 Update Provider Profile

```http
PATCH /providers/{provider_id}
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "description": "Updated description",
  "services": ["branding", "web-design", "marketing", "seo"],
  "portfolio_url": "https://newurl.com"
}
```

**Response:** `200 OK` (updated provider object)

---

### 2.6 List Providers

```http
GET /providers
```

**Query Parameters:**

- `provider_type`: `agency`
- `services`: Filter by services (comma-separated)
- `is_verified`: `true` | `false`
- `min_rating`: Minimum average rating (1-5)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "provider_type": "agency",
      "business_name": "Creative Agency Inc.",
      "full_name": "John Doe",
      "services": ["branding", "web-design"],
      "is_verified": true,
      "average_rating": 4.5,
      "total_reviews": 23
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## 3. Wallet & Financial Operations

### 3.1 Get Wallet Balance

```http
GET /providers/{provider_id}/wallet
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "provider_id": "uuid",
  "balance": 500.0,
  "total_spent": 1200.5,
  "total_deposited": 1700.5,
  "currency": "EGP",
  "updated_at": "2025-12-06T10:00:00Z"
}
```

---

### 3.2 Get Wallet Transactions

```http
GET /providers/{provider_id}/wallet/transactions
```

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**

- `type`: `deposit` | `debit` | `refund` | `adjustment`
- `reference_type`: `lead_unlock` | `subscription` | `top_up`
- `start_date`: ISO 8601 date
- `end_date`: ISO 8601 date
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 500.0,
      "balance_before": 0.0,
      "balance_after": 500.0,
      "description": "Wallet top-up via Paymob",
      "metadata": {
        "payment_provider": "paymob",
        "external_transaction_id": "paymob_123",
        "payment_method": "card",
        "card_last_four": "4242"
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
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### 3.3 Initiate Deposit (Paymob/Stripe)

```http
POST /providers/{provider_id}/wallet/deposit
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "amount": 500.0,
  "payment_provider": "paymob",
  "return_url": "https://app.rabet.com/wallet/success"
}
```

**Response:** `200 OK`

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

### 3.4 Webhook - Payment Confirmation

```http
POST /webhooks/payments/{provider}
```

**Path Parameters:**

- `provider`: `paymob` | `stripe`

**Request Body:** Provider-specific webhook payload

**Response:** `200 OK`

**Note:** This endpoint processes payment confirmations from Paymob/Stripe and creates corresponding `WALLET_TRANSACTION` records.

---

## 4. Service Requests

### 4.1 Create Request

```http
POST /requests
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "title": "Need a modern website redesign",
  "description": "Looking for a creative agency to redesign our e-commerce website...",
  "category": "web-design",
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "deadline": "2025-12-20T00:00:00Z",
  "status": "draft" // or "published"
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Need a modern website redesign",
  "description": "Looking for a creative agency...",
  "category": "web-design",
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "status": "draft",
  "deadline": "2025-12-20T00:00:00Z",
  "created_at": "2025-12-06T10:00:00Z"
}
```

---

### 4.2 Get Request Details

```http
GET /requests/{request_id}
```

**Headers:** `Authorization: Bearer {access_token}` (optional for anonymized view)

**Response:** `200 OK`

**Anonymized (not unlocked):**

```json
{
  "id": "uuid",
  "title": "Need a modern website redesign",
  "description": "Looking for a creative agency...",
  "category": "web-design",
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "status": "published",
  "deadline": "2025-12-20T00:00:00Z",
  "created_at": "2025-12-06T10:00:00Z",
  "is_unlocked": false,
  "unlock_fee": 50.0
}
```

**Unlocked (after agency pays):**

```json
{
  "id": "uuid",
  "title": "Need a modern website redesign",
  "description": "Looking for a creative agency...",
  "category": "web-design",
  "budget_range": "5000-10000",
  "location": "Cairo, Egypt",
  "status": "published",
  "deadline": "2025-12-20T00:00:00Z",
  "client": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+201234567890"
  },
  "is_unlocked": true,
  "unlocked_at": "2025-12-06T11:00:00Z"
}
```

---

### 4.3 List Requests

```http
GET /requests
```

**Query Parameters:**

- `category`: Filter by category
- `status`: `published` | `in_progress` | `completed`
- `budget_min`: Minimum budget
- `budget_max`: Maximum budget
- `location`: Filter by location
- `search`: Search in title/description
- `sort`: `created_at` | `deadline` | `budget`
- `order`: `asc` | `desc`
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Need a modern website redesign",
      "category": "web-design",
      "budget_range": "5000-10000",
      "location": "Cairo, Egypt",
      "status": "published",
      "created_at": "2025-12-06T10:00:00Z",
      "unlock_fee": 50.0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 234,
    "total_pages": 12
  }
}
```

---

### 4.4 Update Request

```http
PATCH /requests/{request_id}
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "published"
}
```

**Response:** `200 OK` (updated request object)

---

### 4.5 Delete Request

```http
DELETE /requests/{request_id}
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `204 No Content`

---

### 4.6 Get My Requests (Client)

```http
GET /users/me/requests
```

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**

- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK` (list of user's requests with full details)

---

## 5. Lead Unlocks

### 5.1 Unlock Lead

```http
POST /requests/{request_id}/unlock
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "request_id": "uuid",
  "provider_id": "uuid",
  "unlock_fee": 50.0,
  "wallet_balance_before": 500.0,
  "wallet_balance_after": 450.0,
  "status": "completed",
  "unlocked_at": "2025-12-06T11:00:00Z",
  "completed_at": "2025-12-06T11:00:00Z",
  "request": {
    "id": "uuid",
    "title": "Need a modern website redesign",
    "client": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+201234567890"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Insufficient wallet balance
- `409 Conflict`: Already unlocked by this provider
- `403 Forbidden`: Request not published or email not verified

---

### 5.2 Get Provider's Unlocked Leads

```http
GET /providers/{provider_id}/unlocks
```

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**

- `status`: `completed` | `refunded`
- `start_date`: ISO 8601 date
- `end_date`: ISO 8601 date
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "request_id": "uuid",
      "unlock_fee": 50.0,
      "status": "completed",
      "unlocked_at": "2025-12-06T11:00:00Z",
      "request": {
        "title": "Need a modern website redesign",
        "category": "web-design",
        "budget_range": "5000-10000"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

---

### 5.3 Get Request's Unlocks (Client)

```http
GET /requests/{request_id}/unlocks
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "provider": {
        "id": "uuid",
        "business_name": "Creative Agency Inc.",
        "average_rating": 4.5,
        "is_verified": true
      },
      "unlocked_at": "2025-12-06T11:00:00Z"
    }
  ],
  "total": 5
}
```

---

## 6. Reviews & Ratings

### 6.1 Create Review

```http
POST /requests/{request_id}/reviews
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "provider_id": "uuid",
  "rating": 5,
  "comment": "Excellent work! Very professional and delivered on time."
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "request_id": "uuid",
  "client_id": "uuid",
  "provider_id": "uuid",
  "rating": 5,
  "comment": "Excellent work! Very professional...",
  "created_at": "2025-12-06T12:00:00Z"
}
```

**Error:** `403 Forbidden` if client hasn't unlocked or already reviewed

---

### 6.2 Get Provider Reviews

```http
GET /providers/{provider_id}/reviews
```

**Query Parameters:**

- `min_rating`: Filter by minimum rating
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excellent work!...",
      "client": {
        "full_name": "John Doe",
        "avatar_url": "https://cdn.rabet.com/avatars/user.jpg"
      },
      "request": {
        "title": "Need a modern website redesign",
        "category": "web-design"
      },
      "created_at": "2025-12-06T12:00:00Z"
    }
  ],
  "summary": {
    "average_rating": 4.5,
    "total_reviews": 23,
    "rating_distribution": {
      "5": 15,
      "4": 5,
      "3": 2,
      "2": 1,
      "1": 0
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 23,
    "total_pages": 2
  }
}
```

---

### 6.3 Update Review

```http
PATCH /reviews/{review_id}
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Updated review comment"
}
```

**Response:** `200 OK` (updated review object)

---

### 6.4 Delete Review

```http
DELETE /reviews/{review_id}
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `204 No Content`

---

## 7. Subscriptions

### 7.1 Get Subscription Plans

```http
GET /subscriptions/plans
```

**Response:** `200 OK`

```json
{
  "plans": [
    {
      "plan_type": "free",
      "price": 0,
      "free_unlocks": 0,
      "priority_listing": false,
      "features": ["Basic profile", "Browse requests"]
    },
    {
      "plan_type": "basic",
      "price": 299,
      "free_unlocks": 5,
      "priority_listing": false,
      "features": ["5 free unlocks/month", "Email support"]
    },
    {
      "plan_type": "premium",
      "price": 799,
      "free_unlocks": 20,
      "priority_listing": true,
      "features": [
        "20 free unlocks/month",
        "Priority listing",
        "Priority support"
      ]
    }
  ]
}
```

---

### 7.2 Subscribe to Plan

```http
POST /providers/{provider_id}/subscription
```

**Headers:** `Authorization: Bearer {access_token}`

**Request Body:**

```json
{
  "plan_type": "premium",
  "billing_cycle": "monthly" // or "annual"
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "provider_id": "uuid",
  "plan_type": "premium",
  "free_unlocks_remaining": 20,
  "priority_listing": true,
  "starts_at": "2025-12-06T12:00:00Z",
  "expires_at": "2026-01-06T12:00:00Z",
  "status": "active"
}
```

---

### 7.3 Get Current Subscription

```http
GET /providers/{provider_id}/subscription
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "plan_type": "premium",
  "free_unlocks_remaining": 15,
  "priority_listing": true,
  "starts_at": "2025-12-06T12:00:00Z",
  "expires_at": "2026-01-06T12:00:00Z",
  "status": "active",
  "auto_renew": true
}
```

---

### 7.4 Cancel Subscription

```http
DELETE /providers/{provider_id}/subscription
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "message": "Subscription cancelled",
  "expires_at": "2026-01-06T12:00:00Z",
  "status": "cancelled"
}
```

---

## 8. Notifications

### 8.1 Get User Notifications

```http
GET /users/me/notifications
```

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**

- `type`: `request_update` | `new_unlock` | `review`
- `is_read`: `true` | `false`
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "new_unlock",
      "title": "New unlock on your request",
      "message": "Creative Agency Inc. unlocked your request 'Website redesign'",
      "is_read": false,
      "metadata": {
        "request_id": "uuid",
        "provider_id": "uuid"
      },
      "created_at": "2025-12-06T11:00:00Z"
    }
  ],
  "unread_count": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### 8.2 Mark Notification as Read

```http
PATCH /notifications/{notification_id}/read
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "is_read": true
}
```

---

### 8.3 Mark All Notifications as Read

```http
POST /notifications/mark-all-read
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `200 OK`

```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

### 8.4 Delete Notification

```http
DELETE /notifications/{notification_id}
```

**Headers:** `Authorization: Bearer {access_token}`

**Response:** `204 No Content`

---

## 9. Admin Endpoints

### 9.1 List Provider Applications

```http
GET /admin/provider-applications
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Query Parameters:**

- `status`: `pending` | `approved` | `rejected`
- `provider_type`: `agency`
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "provider_type": "agency",
      "business_name": "Creative Agency Inc.",
      "full_name": "John Doe",
      "application_status": "pending",
      "created_at": "2025-12-06T10:00:00Z",
      "user": {
        "email": "john@example.com",
        "phone": "+201234567890"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### 9.2 Approve Provider Application

```http
POST /admin/provider-applications/{application_id}/approve
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Request Body:**

```json
{
  "notes": "All documents verified"
}
```

**Response:** `200 OK`

```json
{
  "application_id": "uuid",
  "application_status": "approved",
  "provider_profile_id": "uuid",
  "provider_wallet_id": "uuid",
  "approved_at": "2025-12-06T12:00:00Z",
  "message": "Application approved. Provider profile and wallet created."
}
```

**Note:** This endpoint atomically:

1. Updates `PROVIDER_APPLICATION.application_status` to 'approved'
2. Creates a `PROVIDER_PROFILE` record
3. Creates a `PROVIDER_WALLET` record with 0 balance
4. Updates `USER.role` from 'client' to 'provider'

---

### 9.3 Reject Provider Application

```http
POST /admin/provider-applications/{application_id}/reject
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Request Body:**

```json
{
  "rejection_reason": "Incomplete verification documents"
}
```

**Response:** `200 OK`

```json
{
  "application_id": "uuid",
  "application_status": "rejected",
  "rejection_reason": "Incomplete verification documents",
  "rejected_at": "2025-12-06T12:00:00Z"
}
```

---

### 9.4 Moderate Request

```http
PATCH /admin/requests/{request_id}/moderate
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Request Body:**

```json
{
  "status": "cancelled",
  "reason": "Violates platform policies"
}
```

**Response:** `200 OK`

---

### 9.5 Refund Lead Unlock

```http
POST /admin/unlocks/{unlock_id}/refund
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Request Body:**

```json
{
  "reason": "Duplicate unlock due to system error"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "status": "refunded",
  "refunded_at": "2025-12-06T13:00:00Z",
  "refund_amount": 50.0
}
```

---

### 9.6 Manual Wallet Adjustment

```http
POST /admin/providers/{provider_id}/wallet/adjust
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Request Body:**

```json
{
  "amount": 100.0, // positive for credit, negative for debit
  "reason": "Compensation for service downtime"
}
```

**Response:** `200 OK`

```json
{
  "transaction_id": "uuid",
  "type": "adjustment",
  "amount": 100.0,
  "balance_after": 550.0
}
```

---

### 9.7 Get Admin Logs

```http
GET /admin/logs
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Query Parameters:**

- `admin_id`: Filter by admin
- `action_type`: `moderate_request` | `approve_provider` | `reject_provider` | `manage_user`
- `start_date`: ISO 8601 date
- `end_date`: ISO 8601 date
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "admin": {
        "id": "uuid",
        "full_name": "Admin User"
      },
      "action_type": "approve_provider",
      "target_id": "application_uuid",
      "details": {
        "provider_type": "agency",
        "business_name": "Creative Agency Inc.",
        "notes": "All documents verified"
      },
      "created_at": "2025-12-06T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "total_pages": 5
  }
}
```

---

### 9.8 Get Platform Analytics

```http
GET /admin/analytics
```

**Headers:** `Authorization: Bearer {admin_access_token}`

**Query Parameters:**

- `start_date`: ISO 8601 date
- `end_date`: ISO 8601 date

**Response:** `200 OK`

```json
{
  "users": {
    "total": 1250,
    "clients": 890,
    "providers": 360,
    "new_this_period": 45
  },
  "provider_applications": {
    "pending": 23,
    "approved": 187,
    "rejected": 45
  },
  "requests": {
    "total": 567,
    "published": 234,
    "in_progress": 123,
    "completed": 210
  },
  "unlocks": {
    "total": 1890,
    "this_period": 145,
    "total_revenue": 94500.0
  },
  "financials": {
    "total_deposits": 250000.0,
    "total_spent": 189000.0,
    "platform_revenue": 94500.0
  }
}
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient wallet balance to unlock this lead",
    "details": {
      "required": 50.0,
      "available": 20.0
    }
  }
}
```

**HTTP Status Codes:**

- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no response body
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate unlock)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute per IP
- **Read endpoints:** 100 requests per minute per user
- **Write endpoints:** 30 requests per minute per user
- **Webhook endpoints:** No rate limit (validated by signature)

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638789600
```

---

## Pagination

All list endpoints support pagination with consistent query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response format:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Webhooks (Outbound)

Rabet can send webhooks to agency systems for key events:

**Supported Events:**

- `request.unlocked`: New unlock on agency's request
- `review.created`: New review received
- `subscription.renewed`: Subscription auto-renewed
- `subscription.expiring`: Subscription expiring soon (7 days)

**Webhook Payload:**

```json
{
  "event": "request.unlocked",
  "timestamp": "2025-12-06T11:00:00Z",
  "data": {
    "unlock_id": "uuid",
    "request_id": "uuid",
    "agency_id": "uuid"
  }
}
```

**Security:** HMAC signature in `X-Rabet-Signature` header
