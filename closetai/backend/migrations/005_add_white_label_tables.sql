-- Migration: 005_add_white_label_tables.sql
-- Multi-tenant white-label support: tenant_settings, tenant_domains, SSO config
-- Run after 004_create_brands_and_billing.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- TENANT SETTINGS (Brand tokens, theme, config)
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    brand JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

CREATE INDEX idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

-- TENANT DOMAINS (Custom domains per tenant)
CREATE TABLE IF NOT EXISTS tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_cert_arn VARCHAR(255),
    verified_at TIMESTAMPTZ,
    verification_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, domain)
);

CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

-- SSO CONFIGURATION (SAML/OIDC per tenant)
CREATE TABLE IF NOT EXISTS tenant_sso_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    entity_id TEXT,
    sso_url TEXT,
    x509_cert TEXT,
    client_id TEXT,
    client_secret_encrypted TEXT,
    redirect_uris TEXT[],
    scopes TEXT[],
    attribute_mapping JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

-- TENANT BILLING (Stripe per tenant)
CREATE TABLE IF NOT EXISTS tenant_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_connect_account_id TEXT,
    billing_model VARCHAR(50) DEFAULT 'platform',
    monthly_spend_cap INTEGER DEFAULT 0,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Add tenant_id to gen_jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'gen_jobs' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE gen_jobs ADD COLUMN tenant_id UUID REFERENCES brands(id);
    END IF;
END $$;

-- Add tenant_id to api_usage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'api_usage' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE api_usage ADD COLUMN tenant_id UUID REFERENCES brands(id);
    END IF;
END $$;
