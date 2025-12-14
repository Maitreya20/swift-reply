# CallFlow SaaS Architecture

## Overview
After-call automation SaaS for SMEs. Sends WhatsApp messages with SMS fallback after phone calls.

---

## 1. Folder Structure

```
callflow/
├── apps/
│   ├── web/                    # React frontend (Lovable)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/                    # NestJS backend (external)
│       ├── src/
│       │   ├── auth/           # Clerk integration
│       │   ├── organizations/  # Multi-tenant management
│       │   ├── calls/          # Call log ingestion
│       │   ├── messages/       # Message job management
│       │   ├── templates/      # Message templates
│       │   ├── billing/        # Stripe integration
│       │   ├── webhooks/       # External integrations
│       │   └── common/
│       │       ├── guards/
│       │       ├── interceptors/
│       │       └── decorators/
│       └── package.json
│
├── workers/
│   └── n8n/                    # n8n workflows (private)
│       └── send-message.json
│
├── database/
│   └── migrations/
│
└── docker-compose.yml
```

---

## 2. Service Boundaries

### Frontend (React/Lovable)
- Dashboard UI
- Call/message log viewing
- Template viewing (read-only)
- Billing management via Stripe portal
- **NO** direct database access
- **NO** automation logic

### Backend (NestJS)
- Authentication (Clerk)
- Multi-tenant data isolation
- CRUD operations for all entities
- Message job creation
- Stripe subscription management
- Webhook handling (Twilio, Stripe)
- n8n workflow triggering

### Automation Worker (n8n)
- WhatsApp message sending
- SMS fallback logic
- Delivery status callbacks
- **NO** business logic
- **NO** tenant awareness
- **NO** opt-in validation

---

## 3. High-Level Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. CALL COMPLETED
   ┌──────────┐     Webhook      ┌──────────┐
   │  Twilio  │ ───────────────► │  Backend │
   └──────────┘                  └────┬─────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ PostgreSQL  │
                               │ call_logs   │
                               └─────────────┘

2. MESSAGE JOB CREATED
   ┌──────────┐     Create Job   ┌──────────┐
   │  Backend │ ───────────────► │  BullMQ  │
   └──────────┘                  └────┬─────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ PostgreSQL  │
                               │ message_jobs│
                               └─────────────┘

3. MESSAGE SENT
   ┌──────────┐    Secure Webhook  ┌──────────┐
   │  BullMQ  │ ─────────────────► │   n8n    │
   └──────────┘                    └────┬─────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
             ┌──────────┐                            ┌──────────┐
             │ WhatsApp │                            │   SMS    │
             │   API    │                            │   API    │
             └──────────┘                            └──────────┘

4. DELIVERY CONFIRMED
   ┌──────────┐     Callback     ┌──────────┐
   │   n8n    │ ───────────────► │  Backend │
   └──────────┘                  └────┬─────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ PostgreSQL  │
                               │message_logs │
                               └─────────────┘
```

---

## 4. Backend vs n8n Responsibilities

| Concern                | Backend (NestJS)  | n8n Worker        |
|------------------------|-------------------|-------------------|
| Authentication         | ✅                | ❌                |
| Tenant isolation       | ✅                | ❌                |
| Opt-in validation      | ✅                | ❌                |
| Template selection     | ✅                | ❌                |
| Message job creation   | ✅                | ❌                |
| WhatsApp API call      | ❌                | ✅                |
| SMS fallback           | ❌                | ✅                |
| Delivery status update | ✅ (via callback) | ✅ (sends status) |
| Rate limiting          | ✅                | ❌                |
| Error logging          | ✅                | ✅ (basic)        |

---

## 5. Security Considerations

1. **n8n Webhook Security**
   - Use HMAC signature verification
   - IP allowlist if possible
   - Short-lived tokens for callbacks

2. **Multi-tenant Isolation**
   - All queries scoped to `organization_id`
   - RLS policies at database level
   - Clerk organization claims in JWT

3. **API Key Management**
   - WhatsApp/Twilio keys in n8n only
   - Stripe keys in backend only
   - No secrets in frontend

---

## 6. Scaling Considerations

- **Horizontal scaling**: Stateless backend behind load balancer
- **Queue scaling**: BullMQ with multiple workers
- **Database**: Connection pooling with PgBouncer
- **n8n**: Single instance is sufficient for SME scale

---

## 7. Monitoring Recommendations

- **Backend**: OpenTelemetry + Grafana
- **Database**: pg_stat_statements
- **Queue**: BullMQ Dashboard
- **n8n**: Built-in execution history
