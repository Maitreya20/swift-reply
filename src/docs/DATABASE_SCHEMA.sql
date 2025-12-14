-- ============================================
-- CallFlow SaaS - PostgreSQL Schema
-- Multi-tenant after-call automation
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS (Tenants)
-- ============================================
-- Each organization is an isolated tenant.
-- All business data is scoped to an organization.

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Billing
    stripe_customer_id VARCHAR(255) UNIQUE,
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    default_country_code VARCHAR(5) DEFAULT '+1',
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);


-- ============================================
-- USERS
-- ============================================
-- Users belong to organizations with specific roles.
-- Auth is handled by Clerk; we store the Clerk user ID.

CREATE TYPE user_role AS ENUM ('owner', 'agent');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Profile
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Access
    role user_role NOT NULL DEFAULT 'agent',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_clerk ON users(clerk_user_id);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);


-- ============================================
-- SUBSCRIPTIONS
-- ============================================
-- Stripe subscription tracking per organization.

CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid'
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Stripe
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    
    -- Status
    status subscription_status NOT NULL DEFAULT 'trialing',
    
    -- Limits
    messages_limit INTEGER NOT NULL DEFAULT 500,
    messages_used INTEGER NOT NULL DEFAULT 0,
    phone_numbers_limit INTEGER NOT NULL DEFAULT 1,
    team_members_limit INTEGER NOT NULL DEFAULT 2,
    
    -- Dates
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);


-- ============================================
-- PHONE NUMBERS
-- ============================================
-- Phone numbers owned by organizations for sending messages.

CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Number details
    phone_number VARCHAR(20) NOT NULL,
    display_name VARCHAR(100),
    
    -- Provider
    provider VARCHAR(50) NOT NULL, -- 'twilio', 'whatsapp_business'
    provider_id VARCHAR(255), -- Provider's ID for this number
    
    -- Capabilities
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
    sms_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    verified_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phone_numbers_org ON phone_numbers(organization_id);
CREATE UNIQUE INDEX idx_phone_numbers_number ON phone_numbers(phone_number);


-- ============================================
-- CALL LOGS
-- ============================================
-- Records of incoming/outgoing calls that trigger automation.

CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE call_status AS ENUM ('completed', 'missed', 'busy', 'no_answer', 'failed');

CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Call details
    external_call_id VARCHAR(255), -- Twilio SID or similar
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    direction call_direction NOT NULL,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Status
    status call_status NOT NULL,
    
    -- Agent
    handled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Automation tracking
    automation_triggered BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_call_logs_org ON call_logs(organization_id);
CREATE INDEX idx_call_logs_org_date ON call_logs(organization_id, started_at DESC);
CREATE INDEX idx_call_logs_from ON call_logs(from_number);
CREATE INDEX idx_call_logs_external ON call_logs(external_call_id);


-- ============================================
-- MESSAGE TEMPLATES
-- ============================================
-- Pre-approved message templates for automation.

CREATE TYPE template_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Template details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Content (supports variables like {name}, {date})
    body TEXT NOT NULL,
    
    -- Channel preference
    prefer_whatsapp BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    status template_status NOT NULL DEFAULT 'draft',
    
    -- Usage tracking
    usage_count INTEGER NOT NULL DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_templates_org ON message_templates(organization_id);
CREATE INDEX idx_templates_org_status ON message_templates(organization_id, status);


-- ============================================
-- OPT-INS
-- ============================================
-- Consent tracking for messaging recipients.

CREATE TYPE opt_in_status AS ENUM ('pending', 'opted_in', 'opted_out');

CREATE TABLE opt_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Contact
    phone_number VARCHAR(20) NOT NULL,
    
    -- Consent
    status opt_in_status NOT NULL DEFAULT 'pending',
    consented_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    -- Source
    source VARCHAR(50), -- 'sms_reply', 'web_form', 'manual'
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_opt_ins_org_phone ON opt_ins(organization_id, phone_number);
CREATE INDEX idx_opt_ins_status ON opt_ins(organization_id, status);


-- ============================================
-- MESSAGE JOBS
-- ============================================
-- Queue of messages to be sent by n8n worker.

CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE message_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- References
    call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    
    -- Message details
    to_phone_number VARCHAR(20) NOT NULL,
    from_phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
    rendered_body TEXT NOT NULL, -- Template with variables replaced
    
    -- Processing
    status job_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error tracking
    last_error TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_org ON message_jobs(organization_id);
CREATE INDEX idx_jobs_status ON message_jobs(status, scheduled_for);
CREATE INDEX idx_jobs_call ON message_jobs(call_log_id);


-- ============================================
-- MESSAGE LOGS
-- ============================================
-- Delivery logs for sent messages (audit trail).

CREATE TYPE delivery_status AS ENUM (
    'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered'
);
CREATE TYPE message_channel AS ENUM ('whatsapp', 'sms');

CREATE TABLE message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- References
    message_job_id UUID REFERENCES message_jobs(id) ON DELETE SET NULL,
    call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
    
    -- Message details
    to_phone_number VARCHAR(20) NOT NULL,
    from_phone_number VARCHAR(20) NOT NULL,
    body TEXT NOT NULL,
    
    -- Delivery
    channel message_channel NOT NULL,
    status delivery_status NOT NULL DEFAULT 'queued',
    
    -- Provider
    provider_message_id VARCHAR(255), -- Twilio SID, WhatsApp message ID
    
    -- Timing
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Error tracking
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Cost tracking (optional)
    cost_cents INTEGER,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_logs_org ON message_logs(organization_id);
CREATE INDEX idx_message_logs_org_date ON message_logs(organization_id, created_at DESC);
CREATE INDEX idx_message_logs_job ON message_logs(message_job_id);
CREATE INDEX idx_message_logs_call ON message_logs(call_log_id);
CREATE INDEX idx_message_logs_provider ON message_logs(provider_message_id);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- All tables enforce tenant isolation via RLS.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (implement in backend with proper context)
-- CREATE POLICY tenant_isolation ON users
--     USING (organization_id = current_setting('app.current_org_id')::uuid);


-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opt_ins_updated_at BEFORE UPDATE ON opt_ins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON message_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON message_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
