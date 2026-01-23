# Rabet Platform - Entity Relationship Diagram

## Project Overview

**Rabet** is a SaaS-enabled marketplace platform connecting clients and businesses in Egypt with trusted service providers (agencies). The platform operates on a **freemium + pay-per-lead** business model where:

- **Clients** post service requests for free
- **Providers** (agencies) pay a small fee to unlock and contact qualified leads
- **Admins** moderate content, verify providers, and manage platform operations

This ERD defines the core data structure for the MVP phase, focusing on:

- Secure authentication (JWT + OAuth)
- Service request management
- Pay-per-lead unlock system with wallet-based payments
- Agency verification and reviews
- Financial operations tracking (GDPR compliant)
- Optional subscription plans for agencies

The architecture prioritizes **transparency**, **security**, and **scalability** while maintaining compliance with data protection regulations.

---

## 1. USER

Core authentication and user management. Supports JWT and OAuth authentication with three roles: client, agency, and admin.

| Column                   | Type      | Constraints                | Description                                 |
| ------------------------ | --------- | -------------------------- | ------------------------------------------- |
| id                       | string    | PK                         | Unique user identifier (UUID)               |
| email                    | string    | UK, NOT NULL               | User email address                          |
| password_hash            | string    | NULLABLE                   | Hashed password (null for OAuth-only users) |
| full_name                | string    | NOT NULL                   | User's full name                            |
| phone                    | string    |                            | Contact phone number                        |
| avatar_url               | string    |                            | Profile picture URL                         |
| role                     | enum      | NOT NULL, DEFAULT 'client' | `client`, `provider`, or `admin`            |
| auth_provider            | enum      | NOT NULL, DEFAULT 'local'  | `local`, `google`, `facebook`, `apple`      |
| oauth_id                 | string    | NULLABLE                   | OAuth provider user ID                      |
| email_verified           | boolean   | NOT NULL, DEFAULT false    | Email verification status                   |
| email_verified_at        | timestamp | NULLABLE                   | Email verification timestamp                |
| is_active                | boolean   | NOT NULL, DEFAULT true     | Account active status                       |
| is_blocked               | boolean   | NOT NULL, DEFAULT false    | Admin block status                          |
| last_login_at            | timestamp | NULLABLE                   | Last successful login                       |
| password_reset_token     | string    | NULLABLE, INDEXED          | Token for password reset                    |
| password_reset_expires   | timestamp | NULLABLE                   | Password reset token expiry                 |
| email_verification_token | string    | NULLABLE, INDEXED          | Token for email verification                |
| created_at               | timestamp | NOT NULL                   | Account creation time                       |
| updated_at               | timestamp | NOT NULL                   | Last update time                            |

**Indexes:**

- `email` (unique)
- `oauth_id + auth_provider` (composite unique for OAuth users)
- `password_reset_token`, `email_verification_token`

**Notes:**

- `password_hash` is null when user signs up via OAuth only
- `oauth_id` stores the unique identifier from OAuth provider (Google ID, Facebook ID, etc.)
- JWT tokens are stateless and stored client-side only
- For added security, consider adding a separate `REFRESH_TOKEN` table for JWT refresh token rotation

---

## 2. REFRESH_TOKEN

Manages JWT refresh tokens for secure token rotation and session management.

| Column      | Type      | Constraints             | Description                  |
| ----------- | --------- | ----------------------- | ---------------------------- |
| id          | string    | PK                      | Unique token identifier      |
| user_id     | string    | FK → USER.id, INDEXED   | Associated user              |
| token_hash  | string    | UK, NOT NULL            | Hashed refresh token         |
| device_info | string    |                         | User agent/device identifier |
| ip_address  | string    |                         | IP address at token creation |
| expires_at  | timestamp | NOT NULL                | Token expiration time        |
| revoked     | boolean   | NOT NULL, DEFAULT false | Revocation status            |
| revoked_at  | timestamp | NULLABLE                | Revocation timestamp         |
| created_at  | timestamp | NOT NULL                | Token creation time          |

**Indexes:**

- `user_id`
- `token_hash` (unique)
- `expires_at` (for cleanup queries)

**Notes:**

- Store only hashed tokens for security
- Allows revoking specific sessions (e.g., "logout from other devices")
- Clean up expired tokens periodically via cron job

---

## 3. PROVIDER_APPLICATION

Pending applications for providers (agencies) awaiting admin approval.

| Column             | Type      | Constraints                 | Description                       |
| ------------------ | --------- | --------------------------- | --------------------------------- |
| id                 | string    | PK                          | Unique application identifier     |
| user_id            | string    | FK → USER.id, UK            | Associated user account           |
| provider_type      | enum      | NOT NULL                    | `agency`                          |
| business_name      | string    | NULLABLE                    | Business name (for agencies)      |
| full_name          | string    | NOT NULL                    | Provider full name                |
| description        | text      | NOT NULL                    | Provider description              |
| services           | string[]  | NOT NULL                    | Array of offered services         |
| portfolio_url      | string    |                             | Portfolio/website URL             |
| verification_docs  | json      | NOT NULL                    | Documents for verification        |
| application_status | enum      | NOT NULL, DEFAULT 'pending' | `pending`, `approved`, `rejected` |
| rejection_reason   | text      | NULLABLE                    | Reason if rejected                |
| reviewed_by        | string    | FK → USER.id, NULLABLE      | Admin who reviewed                |
| reviewed_at        | timestamp | NULLABLE                    | Review completion time            |
| created_at         | timestamp | NOT NULL                    | Application submission time       |
| updated_at         | timestamp | NOT NULL                    | Last update time                  |

**Indexes:**

- `user_id` (unique)
- `application_status`

**Notes:**

- Users with role `client` can submit provider applications
- Once approved, a `PROVIDER_PROFILE` record is created and user role is updated to `provider`
- Rejected applications can be resubmitted with updates

---

## 4. PROVIDER_PROFILE

Approved provider profiles (agencies) with business details and verification.

| Column         | Type      | Constraints                      | Description                  |
| -------------- | --------- | -------------------------------- | ---------------------------- |
| id             | string    | PK                               | Unique profile identifier    |
| user_id        | string    | FK → USER.id, UK                 | Associated user account      |
| application_id | string    | FK → PROVIDER_APPLICATION.id, UK | Original application         |
| provider_type  | enum      | NOT NULL                         | `agency`                     |
| business_name  | string    | NULLABLE                         | Business name (for agencies) |
| full_name      | string    | NOT NULL                         | Provider full name           |
| description    | text      |                                  | Provider description         |
| services       | string[]  |                                  | Array of offered services    |
| portfolio_url  | string    |                                  | Portfolio/website URL        |
| is_verified    | boolean   | NOT NULL, DEFAULT false          | Manual verification badge    |
| verified_at    | timestamp | NULLABLE                         | Verification completion time |
| is_active      | boolean   | NOT NULL, DEFAULT true           | Account active status        |
| created_at     | timestamp | NOT NULL                         | Profile creation time        |
| updated_at     | timestamp | NOT NULL                         | Last update time             |

**Indexes:**

- `user_id` (unique)
- `application_id` (unique)
- `provider_type`
- `is_verified`

**Notes:**

- Created automatically when `PROVIDER_APPLICATION` is approved
- `is_verified` is separate from approval - provides trust badge after further verification

---

## 5. PROVIDER_WALLET

Manages provider balance, credits, and financial operations.

| Column          | Type      | Constraints                  | Description                  |
| --------------- | --------- | ---------------------------- | ---------------------------- |
| id              | string    | PK                           | Unique wallet identifier     |
| provider_id     | string    | FK → PROVIDER_PROFILE.id, UK | Associated provider          |
| balance         | decimal   | NOT NULL, DEFAULT 0          | Current wallet balance (EGP) |
| total_spent     | decimal   | NOT NULL, DEFAULT 0          | Lifetime spending            |
| total_deposited | decimal   | NOT NULL, DEFAULT 0          | Lifetime deposits            |
| currency        | string    | NOT NULL, DEFAULT 'EGP'      | Wallet currency              |
| created_at      | timestamp | NOT NULL                     | Wallet creation time         |
| updated_at      | timestamp | NOT NULL                     | Last update time             |

**Indexes:**

- `provider_id` (unique)

**Notes:**

- Created automatically when provider profile is approved
- Balance is debited when unlocking leads or making payments
- Balance is credited via deposits/top-ups
- All financial operations logged in `WALLET_TRANSACTION` table

---

## 6. WALLET_TRANSACTION

Detailed log of all wallet operations (deposits, debits, refunds).

| Column         | Type      | Constraints                       | Description                                                   |
| -------------- | --------- | --------------------------------- | ------------------------------------------------------------- |
| id             | string    | PK                                | Unique transaction identifier                                 |
| wallet_id      | string    | FK → PROVIDER_WALLET.id, INDEXED  | Associated wallet                                             |
| provider_id    | string    | FK → PROVIDER_PROFILE.id, INDEXED | Provider owner                                                |
| type           | enum      | NOT NULL                          | `deposit`, `debit`, `refund`, `adjustment`                    |
| amount         | decimal   | NOT NULL                          | Transaction amount (positive for credit, negative for debit)  |
| balance_before | decimal   | NOT NULL                          | Wallet balance before transaction                             |
| balance_after  | decimal   | NOT NULL                          | Wallet balance after transaction                              |
| reference_type | string    | NULLABLE                          | Related entity type (`lead_unlock`, `subscription`, `top_up`) |
| reference_id   | string    | NULLABLE, INDEXED                 | Related entity ID                                             |
| description    | string    |                                   | Human-readable description                                    |
| metadata       | json      |                                   | Additional transaction details                                |
| created_at     | timestamp | NOT NULL                          | Transaction timestamp                                         |

**Indexes:**

- `wallet_id + created_at` (for transaction history queries)
- `provider_id + created_at`
- `reference_type + reference_id` (for lookup by related entity)

**Notes:**

- Immutable audit trail of all wallet operations
- `balance_before` and `balance_after` ensure transaction integrity
- Supports linking to different reference types (unlocks, subscriptions, top-ups)
- **For External Payments (deposits):** Store payment provider details in `metadata`:
  ```json
  {
    "payment_provider": "paymob" | "stripe",
    "external_transaction_id": "paymob_txn_123",
    "payment_method": "card" | "wallet",
    "card_last_four": "4242",
    "card_brand": "visa",
    "provider_status": "completed"
  }
  ```
- **For Lead Unlocks:** `reference_type` = `lead_unlock`, `reference_id` = unlock ID
- GDPR compliant: No sensitive payment data stored, only provider transaction IDs

---

## 7. REQUEST

Service requests posted by clients. Anonymized until unlocked by providers.

| Column       | Type      | Constraints  | Description                                                   |
| ------------ | --------- | ------------ | ------------------------------------------------------------- |
| id           | string    | PK           | Unique request identifier                                     |
| user_id      | string    | FK → USER.id | Client who created request                                    |
| title        | string    | NOT NULL     | Request title                                                 |
| description  | text      | NOT NULL     | Detailed description                                          |
| category     | string    | NOT NULL     | Service category                                              |
| budget_range | string    |              | Expected budget range                                         |
| location     | string    |              | Service location                                              |
| status       | enum      | NOT NULL     | `draft`, `published`, `in_progress`, `completed`, `cancelled` |
| deadline     | timestamp |              | Expected completion deadline                                  |
| created_at   | timestamp | NOT NULL     | Request creation time                                         |
| updated_at   | timestamp | NOT NULL     | Last update time                                              |

---

## 8. LEAD_UNLOCK

Tracks which providers have paid to unlock and contact specific requests (pay-per-lead model).

| Column                | Type      | Constraints                       | Description                                  |
| --------------------- | --------- | --------------------------------- | -------------------------------------------- |
| id                    | string    | PK                                | Unique unlock identifier                     |
| request_id            | string    | FK → REQUEST.id, INDEXED          | Unlocked request                             |
| provider_id           | string    | FK → PROVIDER_PROFILE.id, INDEXED | Provider that unlocked                       |
| wallet_transaction_id | string    | FK → WALLET_TRANSACTION.id, UK    | Associated wallet debit transaction          |
| unlock_fee            | decimal   | NOT NULL                          | Fee paid for unlock (EGP)                    |
| wallet_balance_before | decimal   | NOT NULL                          | Provider wallet balance before unlock        |
| wallet_balance_after  | decimal   | NOT NULL                          | Provider wallet balance after unlock         |
| status                | enum      | NOT NULL                          | `pending`, `completed`, `failed`, `refunded` |
| failed_reason         | string    | NULLABLE                          | Reason if unlock failed                      |
| refunded_at           | timestamp | NULLABLE                          | Refund timestamp if applicable               |
| unlocked_at           | timestamp | NOT NULL                          | Initial unlock attempt timestamp             |
| completed_at          | timestamp | NULLABLE                          | Successful completion timestamp              |

**Indexes:**

- `request_id + provider_id` (unique composite - prevent duplicate unlocks)
- `provider_id + status`
- `wallet_transaction_id` (unique)

**Notes:**

- Each unlock creates a corresponding `WALLET_TRANSACTION` record that debits the wallet
- Balance snapshots ensure transaction integrity
- Failed unlocks don't debit wallet (status remains `failed`)
- Refunds create a new credit `WALLET_TRANSACTION` and update this record

---

## 9. REVIEW

Ratings and feedback from clients about providers after service completion.

| Column      | Type      | Constraints              | Description              |
| ----------- | --------- | ------------------------ | ------------------------ |
| id          | string    | PK                       | Unique review identifier |
| request_id  | string    | FK → REQUEST.id          | Related request          |
| client_id   | string    | FK → USER.id             | Client reviewer          |
| provider_id | string    | FK → PROVIDER_PROFILE.id | Reviewed provider        |
| rating      | integer   | NOT NULL, 1-5            | Rating score             |
| comment     | text      |                          | Review comment           |
| created_at  | timestamp | NOT NULL                 | Review timestamp         |

---

## 10. SUBSCRIPTION

Optional subscription plans offering free unlocks and priority listings.

| Column                 | Type      | Constraints              | Description                         |
| ---------------------- | --------- | ------------------------ | ----------------------------------- |
| id                     | string    | PK                       | Unique subscription identifier      |
| provider_id            | string    | FK → PROVIDER_PROFILE.id | Subscribed provider                 |
| plan_type              | enum      | NOT NULL                 | `free`, `basic`, or `premium`       |
| free_unlocks_remaining | integer   | DEFAULT 0                | Remaining free unlocks              |
| priority_listing       | boolean   | DEFAULT false            | Priority in search results          |
| starts_at              | timestamp | NOT NULL                 | Subscription start date             |
| expires_at             | timestamp | NOT NULL                 | Subscription expiry date            |
| status                 | enum      | NOT NULL                 | `active`, `expired`, or `cancelled` |

---

## 11. NOTIFICATION

Email/push notifications for platform activities.

| Column     | Type      | Constraints   | Description                              |
| ---------- | --------- | ------------- | ---------------------------------------- |
| id         | string    | PK            | Unique notification identifier           |
| user_id    | string    | FK → USER.id  | Recipient user                           |
| type       | enum      | NOT NULL      | `request_update`, `new_unlock`, `review` |
| title      | string    | NOT NULL      | Notification title                       |
| message    | text      | NOT NULL      | Notification content                     |
| is_read    | boolean   | DEFAULT false | Read status                              |
| metadata   | json      |               | Additional data                          |
| created_at | timestamp | NOT NULL      | Notification timestamp                   |

---

## 12. ADMIN_LOG

Audit trail for administrative actions (moderation, verification, user management).

| Column      | Type      | Constraints  | Description                                                              |
| ----------- | --------- | ------------ | ------------------------------------------------------------------------ |
| id          | string    | PK           | Unique log identifier                                                    |
| admin_id    | string    | FK → USER.id | Admin who performed action                                               |
| action_type | enum      | NOT NULL     | `moderate_request`, `approve_provider`, `verify_provider`, `manage_user` |
| target_id   | string    | NOT NULL     | ID of affected entity                                                    |
| details     | json      |              | Action details                                                           |
| created_at  | timestamp | NOT NULL     | Action timestamp                                                         |

---

## Relationships

| From                 | To                   | Relationship | Description                               |
| -------------------- | -------------------- | ------------ | ----------------------------------------- |
| USER                 | REFRESH_TOKEN        | One-to-Many  | User has multiple active sessions         |
| USER                 | PROVIDER_APPLICATION | One-to-One   | User can submit one provider application  |
| USER                 | PROVIDER_PROFILE     | One-to-One   | User has optional provider profile        |
| USER                 | REQUEST              | One-to-Many  | User creates multiple requests            |
| USER                 | NOTIFICATION         | One-to-Many  | User receives notifications               |
| USER                 | REVIEW               | One-to-Many  | User writes reviews                       |
| USER                 | ADMIN_LOG            | One-to-Many  | Admin performs actions                    |
| PROVIDER_APPLICATION | PROVIDER_PROFILE     | One-to-One   | Application creates profile when approved |
| PROVIDER_PROFILE     | PROVIDER_WALLET      | One-to-One   | Provider has wallet                       |
| PROVIDER_PROFILE     | LEAD_UNLOCK          | One-to-Many  | Provider unlocks multiple leads           |
| PROVIDER_PROFILE     | REVIEW               | One-to-Many  | Provider receives reviews                 |
| PROVIDER_PROFILE     | SUBSCRIPTION         | One-to-One   | Provider has subscription                 |
| PROVIDER_WALLET      | WALLET_TRANSACTION   | One-to-Many  | Wallet has transaction history            |
| WALLET_TRANSACTION   | LEAD_UNLOCK          | One-to-One   | Transaction linked to unlock debit        |
| REQUEST              | LEAD_UNLOCK          | One-to-Many  | Request unlocked by providers             |
| REQUEST              | REVIEW               | One-to-Many  | Request reviewed                          |

---

## Key Business Rules

1. **Provider Application Flow**:
   - Users register as `client` role initially
   - Submit `PROVIDER_APPLICATION` to become agency
   - Admin reviews and approves/rejects application
   - Upon approval: `PROVIDER_PROFILE` + `PROVIDER_WALLET` created, user role updated to `provider`
   - Rejected applications can be resubmitted
2. **Pay-per-lead**: Providers pay to unlock request details and contact information
3. **Reviews**: Only clients can review providers, tied to specific requests
4. **Verification**: Providers can earn verification badge after additional checks (separate from approval)
5. **Subscriptions**: Optional; provide free unlocks and priority listing benefits
6. **Authentication**:
   - JWT access tokens (short-lived, 15-30 min) for API authentication
   - Refresh tokens (long-lived, 7-30 days) stored in `REFRESH_TOKEN` table
   - OAuth users may not have password_hash (social login only)
   - Email verification required before posting requests or unlocking leads
7. **Wallet & Payments**:
   - Providers must maintain positive wallet balance to unlock leads
   - All financial operations (deposits, unlocks, refunds) logged in `WALLET_TRANSACTION`
   - External payment flow: Paymob/Stripe webhook → `WALLET_TRANSACTION` (deposit) → `PROVIDER_WALLET` balance update
   - Lead unlock flow: `LEAD_UNLOCK` → `WALLET_TRANSACTION` (debit) → `PROVIDER_WALLET` balance update
   - Refund flow: Admin action → `WALLET_TRANSACTION` (credit) → `PROVIDER_WALLET` balance update
   - No sensitive payment data stored (GDPR compliant) - only provider transaction IDs

---

## Implementation Notes

- Use MongoDB for flexible schema (requests, provider profiles) or PostgreSQL for strict relational integrity
- `json` fields store flexible metadata (verification docs, payment details)
- All timestamps in UTC
- Consider soft deletes for requests and users
- Index on: `REQUEST.status`, `REQUEST.category`, `PROVIDER_PROFILE.provider_type`, `PROVIDER_APPLICATION.application_status`, `LEAD_UNLOCK.provider_id`
- **Provider Approval Workflow**:
  - Implement admin dashboard for reviewing pending applications
  - Send email notifications on application status changes
  - Atomic transaction when approving: create profile + wallet + update user role
  - Archive rejected applications for audit trail
- **Wallet Management**:
  - Implement database transactions for wallet balance updates to ensure atomicity
  - Use row-level locking when updating wallet balance to prevent race conditions
  - Store monetary values as decimal with proper precision (e.g., DECIMAL(10,2) for EGP)
  - Implement idempotency keys for payment operations (prevent duplicate deposits from webhooks)
  - Regularly reconcile wallet balance with transaction history sum
  - Implement minimum balance thresholds and low-balance notifications
  - Prevent negative balances through validation before unlock operations
- **Payment Integration (GDPR Compliant)**:
  - Never store card numbers, CVV, or sensitive payment data
  - Store only provider transaction IDs and minimal metadata (last 4 digits, brand)
  - Use Paymob/Stripe hosted payment pages or tokenization
  - Process payments via provider SDKs/APIs, receive webhooks for status updates
  - Log all payment events in `WALLET_TRANSACTION.metadata` for debugging
- **Authentication Security**:
  - Implement rate limiting on authentication endpoints
  - Use bcrypt/argon2 for password hashing with proper salt rounds
  - Store refresh tokens hashed in database for security
  - Implement CSRF protection for OAuth flows
  - Consider adding 2FA (Two-Factor Authentication) in future phases
