# Rabet Platform - Product Requirements Document (PRD)

## Document Information

**Version:** 1.0  
**Last Updated:** December 10, 2025  
**Status:** Draft  
**Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [Target Market & Users](#3-target-market--users)
4. [User Stories & Use Cases](#4-user-stories--use-cases)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Security & Compliance](#8-security--compliance)
9. [Success Metrics](#9-success-metrics)
10. [Roadmap & Phases](#10-roadmap--phases)
11. [Risk Assessment](#11-risk-assessment)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

**Rabet** is a SaaS-enabled marketplace platform designed to connect clients and businesses in Egypt with verified service providers (agencies). The platform addresses the critical problem of lead acquisition inefficiency in the Egyptian service market by implementing a transparent, pay-per-lead model.

### 1.2 Problem Statement

Current challenges in the Egyptian service marketplace:

- **For Clients**: Difficulty finding trustworthy, verified service providers
- **For Providers**: High customer acquisition costs with uncertain ROI
- **For Market**: Lack of transparency in pricing and quality assurance

### 1.3 Solution

Rabet solves these problems through:

- **Free request posting** for clients seeking services
- **Pay-per-lead unlocking** for providers (agencies)
- **Verified provider profiles** with ratings and reviews
- **Wallet-based payment system** for seamless transactions
- **Freemium subscription tiers** with value-added features

### 1.4 Business Model

- **Primary Revenue**: Pay-per-lead fees (50 EGP average per unlock)
- **Secondary Revenue**: Premium subscriptions for providers
- **Tertiary Revenue**: Future advertising and featured listings

### 1.5 Key Success Metrics

- **Target**: 1,000 active providers within 6 months
- **Target**: 5,000 service requests within first year
- **Target**: 60% unlock-to-contact conversion rate
- **Target**: 4.5+ average provider rating

---

## 2. Product Vision & Strategy

### 2.1 Vision Statement

_"To become the most trusted and efficient marketplace for service providers in Egypt, enabling seamless connections between clients and verified professionals."_

### 2.2 Mission Statement

_"Democratize access to quality service providers while ensuring fair, transparent pricing and building trust through verified profiles and authentic reviews."_

### 2.3 Strategic Objectives

1. **Year 1**: Establish market presence in Cairo with 1,000+ providers
2. **Year 2**: Expand to Alexandria and Giza with enhanced features
3. **Year 3**: Become the go-to platform for service discovery in Egypt

### 2.4 Value Propositions

#### For Clients

- Free service request posting
- Access to verified, reviewed providers
- Transparent pricing and communication
- Quality assurance through ratings

#### For Providers (Agencies)

- Pay only for qualified leads
- No upfront costs or commitments
- Flexible wallet-based payment system
- Subscription benefits (free unlocks, priority listing)

#### For Platform

- Scalable revenue model
- Data-driven insights into service market
- Community-driven quality control

---

## 3. Target Market & Users

### 3.1 Market Segmentation

**Primary Market**: Egypt  
**Focus Cities** (MVP): Cairo, Giza, Alexandria  
**Market Size**: 10M+ small businesses in Egypt

### 3.2 User Personas

#### Persona 1: Sarah - Small Business Owner (Client)

- **Age**: 32
- **Location**: Cairo, Egypt
- **Need**: Website redesign for e-commerce store
- **Pain Point**: Struggles to find trustworthy agencies within budget
- **Goal**: Quick access to verified agencies with portfolio reviews

#### Persona 2: Ahmed - Creative Agency Owner (Provider)

- **Age**: 28
- **Location**: Cairo, Egypt
- **Business Type**: 5-person digital agency
- **Pain Point**: High marketing costs, uncertain lead quality
- **Goal**: Predictable lead flow with transparent pricing

#### Persona 3: Admin - Platform Moderator

- **Age**: 30
- **Location**: Cairo, Egypt
- **Role**: Content moderation and provider verification
- **Goal**: Maintain platform quality and trust

### 3.3 User Segmentation

| Segment              | Percentage | Priority | Monetization                 |
| -------------------- | ---------- | -------- | ---------------------------- |
| Clients (Free Users) | 70%        | High     | Indirect (attract providers) |
| Agency Providers     | 20%        | Critical | Primary revenue              |
| Freelance Providers  | 8%         | Medium   | Secondary revenue            |
| Admin Users          | 2%         | High     | Internal                     |

---

## 4. User Stories & Use Cases

### 4.1 Client User Stories

#### Epic: Service Request Management

**US-C1: Post Service Request**

- **As a** client
- **I want to** post a service request with details (title, description, budget, deadline)
- **So that** I can receive proposals from qualified providers
- **Acceptance Criteria**:
  - Can create draft requests and publish later
  - Must verify email before publishing
  - Can include category, location, budget range
  - Receives confirmation notification after publishing

**US-C2: Manage Requests**

- **As a** client
- **I want to** view, edit, and delete my service requests
- **So that** I can keep my requirements up-to-date
- **Acceptance Criteria**:
  - View list of all my requests with status
  - Edit draft or published requests
  - Delete requests (cannot delete if unlocked by providers)
  - Filter by status (draft, published, in_progress, completed)

**US-C3: View Provider Interest**

- **As a** client
- **I want to** see which providers have unlocked my request
- **So that** I can evaluate interested parties
- **Acceptance Criteria**:
  - See list of providers who unlocked
  - View provider profiles, ratings, and portfolios
  - Receive notification when request is unlocked

**US-C4: Submit Reviews**

- **As a** client
- **I want to** rate and review providers after project completion
- **So that** I can help other clients make informed decisions
- **Acceptance Criteria**:
  - Can only review providers who unlocked my request
  - Rating scale 1-5 stars with optional comment
  - One review per provider per request
  - Can edit/delete review within 30 days

### 4.2 Provider User Stories

#### Epic: Provider Onboarding

**US-P1: Submit Provider Application**

- **As a** new user
- **I want to** apply to become a verified provider
- **So that** I can access client requests and unlock leads
- **Acceptance Criteria**:
  - Submit business details (name, description, services, portfolio)
  - Upload verification documents
  - Receive application status notifications
  - Cannot unlock leads until approved

**US-P2: Manage Provider Profile**

- **As an** approved provider
- **I want to** update my profile and portfolio
- **So that** I can showcase my work and attract clients
- **Acceptance Criteria**:
  - Edit description, services, portfolio URL
  - View profile preview as clients see it
  - See verification badge if verified
  - Track profile views and unlocks

#### Epic: Lead Discovery & Unlocking

**US-P3: Browse Service Requests**

- **As a** provider
- **I want to** search and filter service requests
- **So that** I can find relevant opportunities
- **Acceptance Criteria**:
  - Filter by category, location, budget, deadline
  - Search by keywords in title/description
  - See anonymized client information (no contact details)
  - View unlock fee for each request
  - Sort by date posted, deadline, budget

**US-P4: Unlock Lead**

- **As a** provider
- **I want to** pay to unlock client contact information
- **So that** I can reach out and submit proposals
- **Acceptance Criteria**:
  - View unlock fee before confirming
  - Deduct fee from wallet balance
  - Instantly access client name, email, phone
  - Cannot unlock same request twice
  - Receive low balance warning if insufficient funds
  - Cannot unlock without verified email

**US-P5: Manage Wallet**

- **As a** provider
- **I want to** manage my wallet balance
- **So that** I can unlock leads without interruption
- **Acceptance Criteria**:
  - View current balance and transaction history
  - Deposit funds via Paymob/Stripe
  - See breakdown of deposits, unlocks, refunds
  - Export transaction history (CSV/PDF)
  - Receive low balance notifications

**US-P6: Subscribe to Plans**

- **As a** provider
- **I want to** subscribe to premium plans
- **So that** I can get free unlocks and priority listing
- **Acceptance Criteria**:
  - View plan comparison (Free, Basic, Premium)
  - Subscribe with monthly/annual billing
  - Auto-deduct from wallet or card
  - See remaining free unlocks
  - Downgrade/upgrade plans
  - Auto-renewal with 7-day advance notice

### 4.3 Admin User Stories

#### Epic: Provider Management

**US-A1: Review Provider Applications**

- **As an** admin
- **I want to** review and approve/reject provider applications
- **So that** I can maintain platform quality
- **Acceptance Criteria**:
  - View pending applications queue
  - Review documents and business details
  - Approve (create profile + wallet) or reject with reason
  - Notify applicant of decision
  - Log all approval/rejection actions

**US-A2: Verify Providers**

- **As an** admin
- **I want to** manually verify providers after additional checks
- **So that** clients can trust verified badges
- **Acceptance Criteria**:
  - Mark providers as verified
  - Unverify if fraudulent activity detected
  - Log verification actions

#### Epic: Content Moderation

**US-A3: Moderate Requests**

- **As an** admin
- **I want to** review and moderate service requests
- **So that** I can prevent spam and policy violations
- **Acceptance Criteria**:
  - Flag inappropriate content
  - Cancel requests violating policies
  - Notify clients of moderation actions

**US-A4: Manage Refunds**

- **As an** admin
- **I want to** process refund requests for unlocks
- **So that** I can resolve disputes fairly
- **Acceptance Criteria**:
  - View refund requests with reason
  - Approve (credit wallet) or reject
  - Create adjustment transaction
  - Notify provider of refund

**US-A5: View Analytics**

- **As an** admin
- **I want to** view platform analytics and reports
- **So that** I can make data-driven decisions
- **Acceptance Criteria**:
  - User growth metrics
  - Application approval rates
  - Request and unlock statistics
  - Financial reports (deposits, spending, revenue)
  - Export reports

### 4.4 Use Case: Complete Provider Journey

```
1. User Registration
   ↓
2. Submit Provider Application (US-P1)
   ↓
3. Admin Reviews Application (US-A1)
   ↓
4. Application Approved → Profile & Wallet Created
   ↓
5. Provider Deposits Funds (US-P5)
   ↓
6. Browse & Filter Requests (US-P3)
   ↓
7. Unlock Lead (US-P4)
   ↓
8. Contact Client & Complete Project
   ↓
9. Client Submits Review (US-C4)
   ↓
10. Provider Rating Updated
```

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

#### FR-1.1: User Registration

- Support email/password registration
- Support OAuth (Google, Facebook, Apple)
- Email verification required before core actions
- Default role: `client`
- Password requirements: min 8 chars, 1 uppercase, 1 number

#### FR-1.2: Login & Sessions

- JWT-based authentication (access + refresh tokens)
- Access token: 30 minutes expiry
- Refresh token: 7 days expiry (stored in database)
- Support multiple active sessions
- "Remember me" functionality

#### FR-1.3: Password Management

- Forgot password with email reset link
- Reset link expires in 1 hour
- Minimum 1 hour between reset requests

#### FR-1.4: Profile Management

- Edit full name, phone, avatar
- View account details and role
- Cannot change email (must verify new email)

### 5.2 Provider Application & Verification

#### FR-2.1: Application Submission

- User with `client` role can apply
- One application per user
- Required fields:
  - Full name
  - Description (min 100 chars)
  - Services (array, min 1)
  - Verification documents (JSON)
- Optional fields:
  - Business name (required for agencies)
  - Portfolio URL

#### FR-2.2: Application Review

- Admin views pending applications
- Approve action:
  - Create `PROVIDER_PROFILE` record
  - Create `PROVIDER_WALLET` with 0 balance
  - Update user role to `provider`
  - Send approval email
- Reject action:
  - Add rejection reason
  - Send rejection email with feedback
  - Allow resubmission

#### FR-2.3: Provider Verification

- Separate from approval
- Admin can verify providers after additional checks
- Verification badge shown on profile
- Can be revoked

### 5.3 Service Request Management

#### FR-3.1: Create Request

- Clients can create requests (draft or published)
- Required fields: title, description, category
- Optional fields: budget_range, location, deadline
- Cannot publish without email verification
- Auto-save draft functionality

#### FR-3.2: Request Listing

- Public listing of published requests
- Anonymized client info (no contact details)
- Filters: category, budget, location, status
- Search by keywords
- Sort: date, deadline, budget
- Pagination (20 per page)

#### FR-3.3: Request Details

- **Before unlock**: Show anonymized info + unlock fee
- **After unlock**: Show full client details (name, email, phone)
- Display unlock count

#### FR-3.4: Request Management

- Edit: title, description, budget, deadline
- Delete: only if no unlocks
- Status updates: draft → published → in_progress → completed
- Client receives notifications on status changes

### 5.4 Lead Unlocking System

#### FR-4.1: Unlock Process

- Verify email before unlocking
- Check wallet balance ≥ unlock fee
- Prevent duplicate unlocks (same provider + request)
- Atomic transaction:
  1. Create `LEAD_UNLOCK` record (status: pending)
  2. Create `WALLET_TRANSACTION` (debit)
  3. Update `PROVIDER_WALLET` balance
  4. Update unlock status to `completed`
- On failure: rollback transaction, set status to `failed`

#### FR-4.2: Unlock Fee Structure

- Default: 50 EGP per unlock
- Admin can adjust per request category
- Display fee before unlock confirmation

#### FR-4.3: Unlock History

- Provider views unlocked requests
- Filter by status, date
- Show request details and client info
- Export to CSV

### 5.5 Wallet & Financial System

#### FR-5.1: Wallet Creation

- Auto-created when provider approved
- Initial balance: 0 EGP
- Currency: EGP

#### FR-5.2: Wallet Top-up

- Integration with Paymob (Egypt)
- Integration with Stripe (international backup)
- Minimum deposit: 50 EGP
- Payment flow:
  1. Provider initiates deposit
  2. Redirect to payment gateway
  3. Payment confirmation webhook
  4. Create deposit transaction
  5. Update wallet balance

#### FR-5.3: Transaction History

- List all transactions (deposits, debits, refunds, adjustments)
- Filter by type, date range, reference type
- Show balance before/after each transaction
- Pagination (20 per page)
- Export to CSV/PDF

#### FR-5.4: Low Balance Notifications

- Email notification when balance < 100 EGP
- In-app notification before unlock if insufficient funds

#### FR-5.5: Refunds (Admin Only)

- Admin can refund unlocks
- Create credit transaction
- Update unlock status to `refunded`
- Notify provider

### 5.6 Subscription Plans

#### FR-6.1: Plan Tiers

| Plan    | Price (Monthly) | Free Unlocks | Priority Listing |
| ------- | --------------- | ------------ | ---------------- |
| Free    | 0 EGP           | 0            | No               |
| Basic   | 299 EGP         | 5            | No               |
| Premium | 799 EGP         | 20           | Yes              |

#### FR-6.2: Subscription Management

- Subscribe to plan (monthly/annual billing)
- Auto-renewal from wallet or saved card
- Deduct from wallet first, fallback to card
- Downgrade: effective next billing cycle
- Upgrade: immediate, prorated credit
- Cancel: access until current period ends

#### FR-6.3: Free Unlocks

- Tracked per billing cycle
- Reset on renewal date
- Used before paid unlocks
- Display remaining count

#### FR-6.4: Priority Listing

- Premium subscribers appear first in request listings
- Marked with "Premium" badge

### 5.7 Reviews & Ratings

#### FR-7.1: Submit Review

- Client can review providers who unlocked their requests
- One review per provider per request
- Required: rating (1-5 stars)
- Optional: comment (max 1000 chars)
- Cannot review without completed unlock

#### FR-7.2: Review Display

- Show on provider profile
- Display average rating and total reviews
- Rating distribution (5-star breakdown)
- List individual reviews with:
  - Client name and avatar
  - Rating and comment
  - Request title and category
  - Date posted

#### FR-7.3: Review Management

- Edit review within 30 days
- Delete review within 30 days
- Admin can remove inappropriate reviews

#### FR-7.4: Rating Calculation

- Real-time average calculation
- Update provider profile stats on new review

### 5.8 Notifications

#### FR-8.1: Email Notifications

- New user registration (verification email)
- Password reset request
- Application status update (approved/rejected)
- New unlock on request (client)
- Low wallet balance (provider)
- Subscription renewal/expiration
- New review received

#### FR-8.2: In-App Notifications

- Real-time for critical actions
- Notification center with unread count
- Mark as read functionality
- Filter by type
- Delete notifications

### 5.9 Admin Dashboard

#### FR-9.1: Application Management

- View pending applications queue
- Filter by type, status, date
- Approve/reject with notes
- View applicant details and documents

#### FR-9.2: Content Moderation

- Flag inappropriate requests
- Cancel requests (with reason)
- Remove inappropriate reviews
- Block/unblock users

#### FR-9.3: Provider Management

- View all providers
- Verify/unverify providers
- View provider statistics (unlocks, reviews, revenue)
- Manual wallet adjustments

#### FR-9.4: Analytics & Reporting

- User metrics: total, by role, growth rate
- Application metrics: pending, approved, rejected
- Request metrics: total, by category, by status
- Financial metrics: deposits, spending, platform revenue
- Unlock metrics: total, by provider, conversion rate
- Date range filtering
- Export reports (CSV/PDF)

#### FR-9.5: Audit Logs

- Log all admin actions
- Display: admin name, action type, target, details, timestamp
- Filter by admin, action type, date
- Cannot be modified or deleted

---

## 6. Non-Functional Requirements

### 6.1 Performance

**NFR-1.1: Response Time**

- API endpoints: < 200ms (p95)
- Page load time: < 2 seconds (p95)
- Database queries: < 100ms (p95)

**NFR-1.2: Scalability**

- Support 10,000 concurrent users
- Handle 1M requests/month
- Database: horizontal scaling capability
- CDN for static assets

**NFR-1.3: Availability**

- Uptime: 99.9% (< 43 minutes downtime/month)
- Automated failover for critical services
- Database backups: hourly incremental, daily full

### 6.2 Security

**NFR-2.1: Authentication**

- JWT with RS256 signing
- Refresh token rotation
- Secure password hashing (bcrypt, 12 rounds)
- OAuth 2.0 for social login

**NFR-2.2: Data Protection**

- HTTPS only (TLS 1.3)
- Encrypted data at rest (AES-256)
- Sensitive data encrypted in database
- PCI DSS compliance for payment data (via Paymob/Stripe)

**NFR-2.3: Access Control**

- Role-based access control (RBAC)
- Principle of least privilege
- API rate limiting (see API Design doc)
- CORS restrictions

**NFR-2.4: Input Validation**

- Sanitize all user inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection

### 6.3 Compliance

**NFR-3.1: GDPR Compliance**

- User data export functionality
- Right to be forgotten (account deletion)
- Privacy policy and terms of service
- Cookie consent management
- Data retention policies

**NFR-3.2: Payment Security**

- Never store card numbers or CVV
- Tokenization via payment providers
- PCI DSS Level 1 compliance (via Paymob/Stripe)
- Secure webhook validation (HMAC signatures)

### 6.4 Usability

**NFR-4.1: User Interface**

- Mobile-responsive design (iOS, Android, web)
- Arabic and English language support (i18n)
- RTL layout support for Arabic
- WCAG 2.1 Level AA accessibility

**NFR-4.2: User Experience**

- Maximum 3 clicks to core actions
- Inline validation with helpful error messages
- Loading states for async operations
- Confirmation dialogs for destructive actions

### 6.5 Maintainability

**NFR-5.1: Code Quality**

- Test coverage: > 80%
- Code linting and formatting (ESLint, Prettier)
- TypeScript for type safety
- Comprehensive API documentation (OpenAPI/Swagger)

**NFR-5.2: Monitoring**

- Application performance monitoring (APM)
- Error tracking (Sentry)
- Logging: structured JSON logs
- Alert notifications for critical errors

**NFR-5.3: DevOps**

- CI/CD pipeline (automated testing and deployment)
- Infrastructure as code (Terraform/CloudFormation)
- Blue-green deployment strategy
- Automated database migrations

### 6.6 Compatibility

**NFR-6.1: Browser Support**

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**NFR-6.2: Mobile Support**

- iOS 13+
- Android 8+
- Progressive Web App (PWA) capabilities

---

## 7. Technical Architecture

### 7.1 Technology Stack

#### Frontend

- **Framework**: Next.js 14+ (React 18+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand / React Query
- **Forms**: React Hook Form + Zod validation

#### Backend

- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Next.js (API Routes / Server Actions)
- **Language**: TypeScript
- **API**: RESTful JSON API / Server Actions
- **Validation**: Zod schemas

#### Database

- **Primary**: PostgreSQL 15+ (relational data)
- **Alternative**: MongoDB (flexible schemas)
- **ORM**: Prisma (PostgreSQL) / Mongoose (MongoDB)
- **Caching**: Redis

#### Payment Integration

- **Egypt**: Paymob
- **International**: Stripe
- **Implementation**: Webhook-based confirmation

#### Infrastructure

- **Hosting**: AWS / DigitalOcean
- **CDN**: CloudFront / Cloudflare
- **Storage**: S3 (documents, avatars)
- **Email**: SendGrid / AWS SES
- **Monitoring**: Sentry + CloudWatch

### 7.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  (Next.js PWA - Web, iOS, Android)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway / CDN                      │
│        (Rate Limiting, CORS, HTTPS, Caching)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
### 7.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Next.js Fullstack Application               │
│                                                         │
│  ┌──────────────────┐   ┌────────────────────────────┐  │
│  │    Frontend      │   │      Backend / API         │  │
│  │ (Pages & Comps)  │   │ (Server Actions / Routes)  │  │
│  └──────────────────┘   └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                       Database                          │
│           (PostgreSQL + Prisma / MongoDB)               │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Database Schema

Refer to **ERD.md** for complete entity definitions and relationships.

**Key Entities**:

1. USER (authentication, profiles)
2. REFRESH_TOKEN (session management)
3. PROVIDER_APPLICATION (onboarding)
4. PROVIDER_PROFILE (verified providers)
5. PROVIDER_WALLET (financial accounts)
6. WALLET_TRANSACTION (audit trail)
7. REQUEST (service requests)
8. LEAD_UNLOCK (pay-per-lead tracking)
9. REVIEW (ratings and feedback)
10. SUBSCRIPTION (premium plans)
11. NOTIFICATION (user alerts)
12. ADMIN_LOG (audit trail)

### 7.4 API Design

Refer to **API_DESIGN.md** for complete endpoint specifications.

**Base URL**: `https://api.rabet.com/v1`

**Key Endpoints**:

- `/auth/*` - Authentication
- `/users/*` - User management
- `/providers/*` - Provider profiles
- `/requests/*` - Service requests
- `/reviews/*` - Ratings and reviews
- `/admin/*` - Administrative actions

### 7.5 Data Flow: Lead Unlock Transaction

```
1. Provider clicks "Unlock Lead"
   ↓
2. Frontend: Validate email verification
   ↓
3. Frontend: Confirm unlock fee
   ↓
4. API: POST /requests/{id}/unlock
   ↓
5. Backend: Start database transaction
   ↓
6. Backend: Check wallet balance >= fee
   ↓
7. Backend: Create LEAD_UNLOCK (status: pending)
   ↓
8. Backend: Create WALLET_TRANSACTION (debit)
   ↓
9. Backend: Update PROVIDER_WALLET balance
   ↓
10. Backend: Update LEAD_UNLOCK (status: completed)
   ↓
11. Backend: Commit transaction
   ↓
12. Backend: Send notification to client
   ↓
13. API: Return unlocked request with client details
   ↓
14. Frontend: Display contact information
```

### 7.6 Data Flow: Payment Deposit

```
1. Provider initiates wallet top-up
   ↓
2. API: POST /providers/{id}/wallet/deposit
   ↓
3. Backend: Create payment session with Paymob/Stripe
   ↓
4. API: Return payment_url
   ↓
5. Frontend: Redirect to payment gateway
   ↓
6. User completes payment on Paymob/Stripe
   ↓
7. Payment gateway sends webhook to API
   ↓
8. API: POST /webhooks/payments/{provider}
   ↓
9. Backend: Verify webhook signature (HMAC)
   ↓
10. Backend: Start database transaction
   ↓
11. Backend: Create WALLET_TRANSACTION (deposit)
   ↓
12. Backend: Update PROVIDER_WALLET balance
   ↓
13. Backend: Commit transaction
   ↓
14. Backend: Send confirmation email
   ↓
15. Frontend: Redirect to success page
```

---

## 8. Security & Compliance

### 8.1 Authentication Security

**Token Management**

- Access tokens: JWT with 30-minute expiry
- Refresh tokens: Hashed in database, 7-day expiry
- Automatic token rotation on refresh
- Revocation support for logout

**Password Security**

- Bcrypt hashing (12 rounds)
- Password complexity requirements
- Rate limiting on login (5 attempts/minute)
- Account lockout after 10 failed attempts (1-hour cooldown)

**OAuth Security**

- State parameter for CSRF protection
- Validate OAuth tokens with provider
- Link OAuth accounts to existing emails

### 8.2 Payment Security

**PCI DSS Compliance**

- Never store card data on our servers
- Paymob/Stripe hosted payment pages
- Tokenization for saved cards
- HTTPS only for payment flows

**Webhook Security**

- HMAC signature validation
- Idempotency keys to prevent duplicate processing
- IP whitelisting for webhook endpoints

### 8.3 Data Privacy (GDPR)

**User Rights**

- **Right to access**: Export user data (JSON format)
- **Right to erasure**: Delete account and associated data
- **Right to rectification**: Edit profile information
- **Right to portability**: Download data in machine-readable format

**Data Retention**

- User accounts: Indefinite (until user deletes)
- Deleted accounts: 30-day grace period
- Logs: 90 days retention
- Financial records: 7 years (legal requirement)

**Privacy Measures**

- Privacy policy clearly displayed
- Cookie consent banner
- Opt-in for marketing emails
- Anonymize client data until unlock

### 8.4 Security Best Practices

**Input Validation**

- Validate all inputs (frontend + backend)
- Sanitize user-generated content
- Parameterized database queries
- Content Security Policy (CSP) headers

**Rate Limiting**

- Per API Design document
- DDoS protection via CDN
- Progressive rate limiting for suspicious activity

**Monitoring & Auditing**

- Log all authentication attempts
- Track admin actions in ADMIN_LOG
- Alert on suspicious patterns (multiple failed logins, unusual spending)
- Regular security audits and penetration testing

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPIs)

#### Business Metrics

| Metric              | Target (6 months) | Target (1 year) |
| ------------------- | ----------------- | --------------- |
| Active Providers    | 1,000             | 5,000           |
| Service Requests    | 2,000             | 10,000          |
| Lead Unlocks        | 5,000             | 50,000          |
| Platform Revenue    | 250,000 EGP       | 2,500,000 EGP   |
| Premium Subscribers | 100               | 500             |

#### User Engagement

| Metric                             | Target |
| ---------------------------------- | ------ |
| Unlock-to-Contact Conversion       | 60%    |
| Client-to-Request Conversion       | 40%    |
| Provider Application Approval Rate | 70%    |
| Average Provider Rating            | 4.5/5  |
| Repeat Client Rate                 | 50%    |

#### Operational Metrics

| Metric                  | Target     |
| ----------------------- | ---------- |
| Application Review Time | < 48 hours |
| Support Response Time   | < 4 hours  |
| Payment Success Rate    | > 98%      |
| Refund Rate             | < 2%       |

### 9.2 Analytics & Tracking

**User Analytics**

- Registration funnel conversion
- Provider application completion rate
- Request posting frequency
- Unlock patterns (time, category, provider type)

**Financial Analytics**

- Average wallet top-up amount
- Unlock fee revenue by category
- Subscription revenue breakdown
- Provider lifetime value (LTV)

**Product Analytics**

- Feature adoption rates
- User retention (D1, D7, D30)
- Session duration and frequency
- Drop-off points in key flows

### 9.3 A/B Testing Plan

**Priority Experiments**

1. Unlock fee pricing (45 EGP vs 50 EGP vs 55 EGP)
2. Provider application form length (short vs detailed)
3. Request listing layout (grid vs list)
4. Subscription plan positioning (3-tier vs 2-tier)

---

## 10. Roadmap & Phases

### 10.1 Phase 1: MVP (Months 1-3)

**Goal**: Launch core marketplace functionality

**Features**:

- ✅ User authentication (email + OAuth)
- ✅ Provider application and approval
- ✅ Service request posting and browsing
- ✅ Pay-per-lead unlock system
- ✅ Wallet management (Paymob integration)
- ✅ Basic reviews and ratings
- ✅ Admin dashboard (applications, moderation)
- ✅ Email notifications

**Success Criteria**:

- 100 approved providers
- 500 service requests
- 1,000 lead unlocks
- < 5% refund rate

### 10.2 Phase 2: Growth Features (Months 4-6)

**Goal**: Enhance user experience and retention

**Features**:

- ✅ Subscription plans (Basic, Premium)
- ✅ Advanced search and filters
- ✅ Provider verification badges
- ✅ In-app notifications (real-time)
- ✅ Mobile app (React Native / PWA)
- ✅ Analytics dashboard for providers
- ✅ Multi-language support (Arabic + English)
- ✅ Saved searches for providers

**Success Criteria**:

- 500 active providers
- 2,000 service requests
- 100 premium subscribers
- 4.5+ average platform rating

### 10.3 Phase 3: Advanced Features (Months 7-12)

**Goal**: Differentiate from competitors and scale

**Features**:

- Chat/messaging system (provider-client)
- Proposal submission system
- Portfolio showcases
- Featured listings (advertising revenue)
- Referral program
- Provider badges (top-rated, verified, responsive)
- Request matching algorithm (AI recommendations)
- CRM integration for agencies

**Success Criteria**:

- 2,000 active providers
- 10,000 service requests
- 500 premium subscribers
- Break-even revenue

### 10.4 Phase 4: Enterprise & Scale (Year 2+)

**Goal**: Become category leader

**Features**:

- Enterprise accounts (multi-user teams)
- API access for integrations
- White-label solutions
- Expansion to new cities/countries
- Video portfolios
- Verified client badges
- Escrow payment system
- Advanced analytics (BI dashboards)

---

## 11. Risk Assessment

### 11.1 Technical Risks

| Risk                             | Impact   | Probability | Mitigation                                       |
| -------------------------------- | -------- | ----------- | ------------------------------------------------ |
| Payment gateway downtime         | High     | Medium      | Multi-provider failover (Paymob + Stripe)        |
| Database performance degradation | High     | Low         | Caching layer (Redis), query optimization        |
| Security breach (data leak)      | Critical | Low         | Security audits, encryption, penetration testing |
| Scalability issues               | Medium   | Medium      | Horizontal scaling, load testing                 |

### 11.2 Business Risks

| Risk                            | Impact   | Probability | Mitigation                                       |
| ------------------------------- | -------- | ----------- | ------------------------------------------------ |
| Low provider adoption           | Critical | Medium      | Aggressive onboarding campaigns, free trials     |
| Low client engagement           | High     | Medium      | Content marketing, SEO, partnerships             |
| Competitor with better pricing  | Medium   | High        | Focus on quality over price, verification badges |
| Fraud (fake requests/providers) | High     | Medium      | Manual verification, fraud detection algorithms  |

### 11.3 Operational Risks

| Risk                              | Impact | Probability | Mitigation                                      |
| --------------------------------- | ------ | ----------- | ----------------------------------------------- |
| Slow application review times     | Medium | High        | Hire dedicated reviewers, automate checks       |
| Customer support overload         | Medium | High        | Knowledge base, chatbots, tiered support        |
| Payment disputes                  | Medium | Medium      | Clear refund policy, dispute resolution process |
| Regulatory changes (data privacy) | High   | Low         | Legal counsel, compliance monitoring            |

### 11.4 Market Risks

| Risk                        | Impact | Probability | Mitigation                                |
| --------------------------- | ------ | ----------- | ----------------------------------------- |
| Economic downturn in Egypt  | High   | Medium      | Flexible pricing, international expansion |
| Market saturation           | Medium | Low         | Niche specialization, superior UX         |
| Currency fluctuations (EGP) | Medium | High        | Multi-currency support in future          |

---

## 12. Appendix

### 12.1 Glossary

- **Client**: User seeking services (default role)
- **Provider**: Verified agency offering services
- **Lead**: Service request with client contact information
- **Unlock**: Action of paying to access lead details
- **Wallet**: Provider's balance account on the platform
- **Application**: Provider onboarding submission
- **Verification**: Manual admin approval for trust badge

### 12.2 Assumptions

1. Target market is primarily Cairo, Egypt (MVP)
2. Average unlock fee: 50 EGP
3. Users have basic internet access and smartphones
4. Payment infrastructure (Paymob) is reliable in Egypt
5. Manual provider verification is feasible at MVP scale (<1000 providers)

### 12.3 Dependencies

**External Services**:

- Paymob (payment processing)
- Stripe (backup payment, international)
- SendGrid/AWS SES (email delivery)
- AWS/DigitalOcean (hosting)
- Cloudflare (CDN, DDoS protection)

**Third-party Libraries**:

- Next.js, React (frontend)
- Express/Fastify (backend)
- Prisma/Mongoose (ORM)
- Zod (validation)

### 12.4 Future Considerations

**Post-MVP Features** (not in initial roadmap):

- Video calls for consultations
- Calendar integration for appointments
- Invoice generation and tracking
- Provider certifications and courses
- Client project management tools
- Mobile apps (native iOS/Android)
- International expansion (MENA region)

### 12.5 References

- [ERD.md](./ERD.md) - Entity Relationship Diagram
- [API_DESIGN.md](./API_DESIGN.md) - API Specifications
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Development Guidelines

### 12.6 Document History

| Version | Date       | Author       | Changes                                   |
| ------- | ---------- | ------------ | ----------------------------------------- |
| 1.0     | 2025-12-10 | Product Team | Initial draft based on ERD and API Design |

---

**Document Status**: Draft  
**Next Review Date**: 2025-12-17  
**Approvers**: Product Manager, Engineering Lead, Business Owner
