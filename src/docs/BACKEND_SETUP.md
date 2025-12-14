# Swift Reply Backend Setup

> This is a **separate repository** from the frontend. Do not mix.

## Repository Structure

```
swift-reply-backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── clerk-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── middleware/
│   │   │   └── tenant.middleware.ts
│   │   └── interceptors/
│   │       └── tenant.interceptor.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── strategies/
│   │   │       └── clerk.strategy.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── organizations/
│   │   │   ├── organizations.module.ts
│   │   │   ├── organizations.controller.ts
│   │   │   ├── organizations.service.ts
│   │   │   └── entities/
│   │   │       └── organization.entity.ts
│   │   ├── calls/
│   │   │   ├── calls.module.ts
│   │   │   ├── calls.controller.ts
│   │   │   ├── calls.service.ts
│   │   │   └── entities/
│   │   │       └── call-log.entity.ts
│   │   ├── messages/
│   │   │   ├── messages.module.ts
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── jobs/
│   │   │   │   └── message.processor.ts
│   │   │   └── entities/
│   │   │       ├── message-job.entity.ts
│   │   │       └── message-log.entity.ts
│   │   ├── templates/
│   │   │   ├── templates.module.ts
│   │   │   ├── templates.controller.ts
│   │   │   ├── templates.service.ts
│   │   │   └── entities/
│   │   │       └── message-template.entity.ts
│   │   ├── opt-ins/
│   │   │   ├── opt-ins.module.ts
│   │   │   ├── opt-ins.controller.ts
│   │   │   ├── opt-ins.service.ts
│   │   │   └── entities/
│   │   │       └── opt-in.entity.ts
│   │   ├── billing/
│   │   │   ├── billing.module.ts
│   │   │   ├── billing.controller.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── stripe.service.ts
│   │   │   └── entities/
│   │   │       └── subscription.entity.ts
│   │   └── webhooks/
│   │       ├── webhooks.module.ts
│   │       └── webhooks.controller.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   └── config/
│       ├── database.config.ts
│       ├── redis.config.ts
│       ├── clerk.config.ts
│       └── stripe.config.ts
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | NestJS | TypeScript backend framework |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma | Type-safe database access |
| Queue | Redis + BullMQ | Job queue for message processing |
| Auth | Clerk | User authentication |
| Billing | Stripe | Subscription management |
| Automation | n8n (later) | Message sending worker |

---

## Environment Variables

```env
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/swift_reply"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# n8n (add later)
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/...
N8N_WEBHOOK_SECRET=your_secret_here
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  users           User[]
  subscriptions   Subscription[]
  phoneNumbers    PhoneNumber[]
  callLogs        CallLog[]
  messageTemplates MessageTemplate[]
  optIns          OptIn[]
  messageJobs     MessageJob[]
  messageLogs     MessageLog[]

  @@map("organizations")
}

model User {
  id             String   @id @default(uuid())
  clerkId        String   @unique @map("clerk_id")
  email          String   @unique
  firstName      String?  @map("first_name")
  lastName       String?  @map("last_name")
  role           Role     @default(AGENT)
  organizationId String   @map("organization_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("users")
}

enum Role {
  OWNER
  AGENT
}

model Subscription {
  id               String   @id @default(uuid())
  organizationId   String   @map("organization_id")
  stripeCustomerId String   @map("stripe_customer_id")
  stripeSubId      String?  @map("stripe_subscription_id")
  plan             Plan     @default(STARTER)
  status           SubStatus @default(ACTIVE)
  currentPeriodEnd DateTime? @map("current_period_end")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("subscriptions")
}

enum Plan {
  STARTER
  GROWTH
  SCALE
}

enum SubStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

model PhoneNumber {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  number         String   @unique
  label          String?
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  callLogs     CallLog[]

  @@map("phone_numbers")
}

model CallLog {
  id             String     @id @default(uuid())
  organizationId String     @map("organization_id")
  phoneNumberId  String     @map("phone_number_id")
  callerPhone    String     @map("caller_phone")
  duration       Int        // seconds
  status         CallStatus @default(COMPLETED)
  agentName      String?    @map("agent_name")
  notes          String?
  createdAt      DateTime   @default(now()) @map("created_at")

  organization Organization  @relation(fields: [organizationId], references: [id])
  phoneNumber  PhoneNumber   @relation(fields: [phoneNumberId], references: [id])
  messageJobs  MessageJob[]

  @@index([organizationId])
  @@map("call_logs")
}

enum CallStatus {
  COMPLETED
  MISSED
  VOICEMAIL
}

model MessageTemplate {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  name           String
  content        String
  channel        Channel  @default(WHATSAPP)
  isActive       Boolean  @default(true) @map("is_active")
  usageCount     Int      @default(0) @map("usage_count")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  messageJobs  MessageJob[]

  @@map("message_templates")
}

enum Channel {
  WHATSAPP
  SMS
}

model OptIn {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  phoneNumber    String   @map("phone_number")
  channel        Channel
  optedInAt      DateTime @default(now()) @map("opted_in_at")
  optedOutAt     DateTime? @map("opted_out_at")
  source         String?

  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, phoneNumber, channel])
  @@map("opt_ins")
}

model MessageJob {
  id             String     @id @default(uuid())
  organizationId String     @map("organization_id")
  callLogId      String     @map("call_log_id")
  templateId     String     @map("template_id")
  recipientPhone String     @map("recipient_phone")
  status         JobStatus  @default(PENDING)
  scheduledFor   DateTime?  @map("scheduled_for")
  attempts       Int        @default(0)
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  organization Organization    @relation(fields: [organizationId], references: [id])
  callLog      CallLog         @relation(fields: [callLogId], references: [id])
  template     MessageTemplate @relation(fields: [templateId], references: [id])
  messageLogs  MessageLog[]

  @@index([organizationId, status])
  @@map("message_jobs")
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model MessageLog {
  id             String        @id @default(uuid())
  organizationId String        @map("organization_id")
  messageJobId   String        @map("message_job_id")
  channel        Channel
  status         MessageStatus @default(PENDING)
  externalId     String?       @map("external_id")
  errorMessage   String?       @map("error_message")
  sentAt         DateTime?     @map("sent_at")
  deliveredAt    DateTime?     @map("delivered_at")
  createdAt      DateTime      @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  messageJob   MessageJob   @relation(fields: [messageJobId], references: [id])

  @@index([organizationId])
  @@map("message_logs")
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}
```

---

## Quick Start Commands

```bash
# 1. Create project
mkdir swift-reply-backend && cd swift-reply-backend
npx @nestjs/cli new . --package-manager npm

# 2. Install dependencies
npm install @nestjs/config @nestjs/bull bull
npm install @prisma/client prisma
npm install stripe @clerk/clerk-sdk-node
npm install ioredis

# 3. Setup Prisma
npx prisma init
# Copy schema above, then:
npx prisma migrate dev --name init

# 4. Run dev server
npm run start:dev
```

---

## Implementation Order

### Phase 1: Core (Week 1)
1. ✅ Database schema (Prisma)
2. ✅ Clerk auth integration
3. ✅ User signup → auto org creation
4. ✅ Tenant isolation middleware

### Phase 2: Data (Week 2)
5. Call logs CRUD
6. Templates CRUD
7. Opt-in management

### Phase 3: Billing (Week 3)
8. Stripe customer creation
9. Subscription management
10. Usage tracking

### Phase 4: Automation (Week 4+)
11. BullMQ job queue
12. n8n webhook integration
13. Message status callbacks

---

## n8n Integration (LATER)

> Do NOT implement until Phases 1-3 are complete.

When ready, the backend will:
1. Create a `MessageJob` record
2. Push to BullMQ queue
3. Worker calls n8n webhook with:
   ```json
   {
     "jobId": "uuid",
     "phone": "+1234567890",
     "template": "Appointment Confirmation",
     "variables": { "name": "John", "date": "Jan 15" },
     "callbackUrl": "https://api.yourapp.com/webhooks/n8n"
   }
   ```
4. n8n sends message (WhatsApp → SMS fallback)
5. n8n calls callback URL with status

---

## Security Checklist

- [ ] All routes behind Clerk auth guard
- [ ] Tenant middleware on all data routes
- [ ] Rate limiting on API endpoints
- [ ] Stripe webhook signature verification
- [ ] n8n webhook secret validation
- [ ] Environment variables in vault (not .env in prod)
