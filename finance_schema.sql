-- =============================================================
-- YTW Portal — Finance Schema
-- Run in Supabase SQL Editor
-- =============================================================

-- Revenue and expense entries
CREATE TABLE public."FinanceEntries" (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL,
  date        DATE        NOT NULL,                -- record month (use 1st of month, e.g. 2025-01-01)
  type        TEXT        NOT NULL CHECK (type IN ('revenue', 'expense')),
  stream      TEXT        NOT NULL CHECK (stream IN ('yoga', 'fnb', 'boutique', 'other')),
  category    TEXT        NOT NULL,                -- e.g. 'classes', 'retail', 'staffing', 'rent'
  amount      NUMERIC(12,2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted  BOOLEAN     NOT NULL DEFAULT false,
  CONSTRAINT finance_entries_pkey PRIMARY KEY (id),
  CONSTRAINT finance_entries_tenant_fkey FOREIGN KEY (tenant_id)
    REFERENCES public."Tenants" (id) ON DELETE CASCADE
);

-- Index for fast dashboard queries
CREATE INDEX idx_finance_entries_tenant_date
  ON public."FinanceEntries" (tenant_id, date, type);

-- RLS
ALTER TABLE public."FinanceEntries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view their finance entries"
  ON public."FinanceEntries" FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public."UserTenants"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can insert their finance entries"
  ON public."FinanceEntries" FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public."UserTenants"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can update their finance entries"
  ON public."FinanceEntries" FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public."UserTenants"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can delete their finance entries"
  ON public."FinanceEntries" FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public."UserTenants"
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================
-- SEED — Jan + Feb 2025 backfill for YTW tenant
-- Replace the tenant_id below with your YTW tenant UUID
-- (run: SELECT id FROM "Tenants" WHERE subdomain = 'ytw')
-- =============================================================

-- January 2025
INSERT INTO public."FinanceEntries" (tenant_id, date, type, stream, category, amount, notes) VALUES
  -- Revenue
  ('YOUR_TENANT_ID', '2025-01-01', 'revenue', 'yoga',     'classes',   45000.00, 'Jan class revenue'),
  ('YOUR_TENANT_ID', '2025-01-01', 'revenue', 'yoga',     'workshops',  8500.00, 'Jan workshops'),
  ('YOUR_TENANT_ID', '2025-01-01', 'revenue', 'fnb',      'cafe',      12000.00, 'Jan café'),
  ('YOUR_TENANT_ID', '2025-01-01', 'revenue', 'boutique', 'retail',     6500.00, 'Jan boutique'),
  -- Expenses
  ('YOUR_TENANT_ID', '2025-01-01', 'expense', 'other',    'staffing',  28000.00, 'Jan payroll'),
  ('YOUR_TENANT_ID', '2025-01-01', 'expense', 'other',    'rent',      12000.00, 'Jan rent'),
  ('YOUR_TENANT_ID', '2025-01-01', 'expense', 'other',    'utilities',  2500.00, 'Jan utilities'),
  ('YOUR_TENANT_ID', '2025-01-01', 'expense', 'fnb',      'supplies',   4200.00, 'Jan F&B supplies'),
  ('YOUR_TENANT_ID', '2025-01-01', 'expense', 'boutique', 'cogs',       2800.00, 'Jan boutique COGS'),
  -- February 2025
  ('YOUR_TENANT_ID', '2025-02-01', 'revenue', 'yoga',     'classes',   42000.00, 'Feb class revenue'),
  ('YOUR_TENANT_ID', '2025-02-01', 'revenue', 'yoga',     'workshops',  9200.00, 'Feb workshops'),
  ('YOUR_TENANT_ID', '2025-02-01', 'revenue', 'fnb',      'cafe',      11500.00, 'Feb café'),
  ('YOUR_TENANT_ID', '2025-02-01', 'revenue', 'boutique', 'retail',     7200.00, 'Feb boutique'),
  ('YOUR_TENANT_ID', '2025-02-01', 'expense', 'other',    'staffing',  28000.00, 'Feb payroll'),
  ('YOUR_TENANT_ID', '2025-02-01', 'expense', 'other',    'rent',      12000.00, 'Feb rent'),
  ('YOUR_TENANT_ID', '2025-02-01', 'expense', 'other',    'utilities',  2200.00, 'Feb utilities'),
  ('YOUR_TENANT_ID', '2025-02-01', 'expense', 'fnb',      'supplies',   3900.00, 'Feb F&B supplies'),
  ('YOUR_TENANT_ID', '2025-02-01', 'expense', 'boutique', 'cogs',       3100.00, 'Feb boutique COGS');
