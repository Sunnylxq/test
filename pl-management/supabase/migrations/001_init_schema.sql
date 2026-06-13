-- =============================================
-- 001: 基盤スキーマ
-- =============================================

-- 会社
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  fiscal_month  INT  NOT NULL DEFAULT 4,
  currency      TEXT NOT NULL DEFAULT 'JPY',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 事業
CREATE TABLE IF NOT EXISTS businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  color         TEXT DEFAULT '#6366F1',
  sort_order    INT  DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- ユーザープロファイル
CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id),
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  global_role   TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (global_role IN ('admin','editor','viewer')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 事業別ユーザー権限
CREATE TABLE IF NOT EXISTS user_business_access (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('admin','editor','viewer')),
  granted_by    UUID REFERENCES user_profiles(id),
  granted_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- PL実績
CREATE TABLE IF NOT EXISTS pl_actuals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fiscal_year   INT  NOT NULL,
  month         INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  sales         NUMERIC(15,2) DEFAULT 0,
  cogs          NUMERIC(15,2) DEFAULT 0,
  sg_personnel  NUMERIC(15,2) DEFAULT 0,
  sg_marketing  NUMERIC(15,2) DEFAULT 0,
  sg_other      NUMERIC(15,2) DEFAULT 0,
  status        TEXT DEFAULT 'draft'
                  CHECK (status IN ('draft','submitted','approved')),
  input_by      UUID REFERENCES user_profiles(id),
  approved_by   UUID REFERENCES user_profiles(id),
  approved_at   TIMESTAMPTZ,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, fiscal_year, month)
);

-- PL計画
CREATE TABLE IF NOT EXISTS pl_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fiscal_year   INT  NOT NULL,
  month         INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  version       INT  NOT NULL DEFAULT 1,
  sales         NUMERIC(15,2) DEFAULT 0,
  cogs          NUMERIC(15,2) DEFAULT 0,
  sg_personnel  NUMERIC(15,2) DEFAULT 0,
  sg_marketing  NUMERIC(15,2) DEFAULT 0,
  sg_other      NUMERIC(15,2) DEFAULT 0,
  created_by    UUID REFERENCES user_profiles(id),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, fiscal_year, month, version)
);

-- 予算
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fiscal_year   INT  NOT NULL,
  version       INT  NOT NULL DEFAULT 1,
  label         TEXT,
  status        TEXT DEFAULT 'draft'
                  CHECK (status IN ('draft','submitted','reviewing','approved','rejected')),
  submitted_by  UUID REFERENCES user_profiles(id),
  submitted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, fiscal_year, version)
);

-- 予算明細
CREATE TABLE IF NOT EXISTS budget_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id     UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  month         INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  sales         NUMERIC(15,2) DEFAULT 0,
  cogs          NUMERIC(15,2) DEFAULT 0,
  sg_personnel  NUMERIC(15,2) DEFAULT 0,
  sg_marketing  NUMERIC(15,2) DEFAULT 0,
  sg_other      NUMERIC(15,2) DEFAULT 0,
  UNIQUE(budget_id, month)
);

-- 予算承認フロー
CREATE TABLE IF NOT EXISTS budget_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id     UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  step          INT  NOT NULL,
  approver_id   UUID REFERENCES user_profiles(id),
  status        TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  comment       TEXT,
  actioned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- アラート
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  alert_type      TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('red','yellow','green')),
  title           TEXT NOT NULL,
  description     TEXT,
  fiscal_year     INT,
  month           INT,
  threshold_value NUMERIC,
  actual_value    NUMERIC,
  is_resolved     BOOLEAN DEFAULT false,
  resolved_by     UUID REFERENCES user_profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- KPIスナップショット
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  fiscal_year     INT  NOT NULL,
  month           INT  NOT NULL,
  cum_sales       NUMERIC(15,2),
  cum_plan_sales  NUMERIC(15,2),
  cum_op          NUMERIC(15,2),
  cum_plan_op     NUMERIC(15,2),
  cum_margin      NUMERIC(8,4),
  cum_achieve     NUMERIC(8,4),
  cum_yoy         NUMERIC(8,4),
  generated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, fiscal_year, month)
);

-- 監査ログ
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  before_val  JSONB,
  after_val   JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 計算ビュー
CREATE OR REPLACE VIEW pl_computed AS
SELECT
  a.id, a.business_id, a.fiscal_year, a.month,
  a.sales,
  a.cogs,
  (a.sg_personnel + a.sg_marketing + a.sg_other)                         AS sg_total,
  (a.sales - a.cogs)                                                       AS gross_profit,
  (a.sales - a.cogs - a.sg_personnel - a.sg_marketing - a.sg_other)       AS operating_profit,
  CASE WHEN a.sales > 0
    THEN ROUND((a.sales - a.cogs - a.sg_personnel - a.sg_marketing - a.sg_other) / a.sales * 100, 2)
    ELSE 0
  END                                                                      AS op_margin,
  a.status, a.input_by, a.note, a.created_at, a.updated_at
FROM pl_actuals a;

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pl_actuals_updated_at
  BEFORE UPDATE ON pl_actuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
