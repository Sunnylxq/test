-- =============================================
-- 002: RLS ポリシー
-- =============================================

ALTER TABLE companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_access  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_actuals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_approvals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;

-- ヘルパー: 自分のcompany_id取得
CREATE OR REPLACE FUNCTION my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ヘルパー: 自分のglobal_role取得
CREATE OR REPLACE FUNCTION my_global_role()
RETURNS TEXT AS $$
  SELECT global_role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ヘルパー: 事業アクセス権チェック
CREATE OR REPLACE FUNCTION has_business_access(bid UUID, min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_business_access uba
    WHERE uba.business_id = bid
      AND uba.user_id = auth.uid()
      AND CASE
        WHEN min_role = 'admin'  THEN uba.role = 'admin'
        WHEN min_role = 'editor' THEN uba.role IN ('editor','admin')
        ELSE true
      END
  ) OR my_global_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- companies
CREATE POLICY "company_select" ON companies
  FOR SELECT USING (id = my_company_id());

-- businesses
CREATE POLICY "businesses_select" ON businesses
  FOR SELECT USING (
    company_id = my_company_id()
    AND (my_global_role() = 'admin' OR has_business_access(id))
  );
CREATE POLICY "businesses_insert" ON businesses
  FOR INSERT WITH CHECK (company_id = my_company_id() AND my_global_role() = 'admin');
CREATE POLICY "businesses_update" ON businesses
  FOR UPDATE USING (company_id = my_company_id() AND my_global_role() = 'admin');
CREATE POLICY "businesses_delete" ON businesses
  FOR DELETE USING (company_id = my_company_id() AND my_global_role() = 'admin');

-- user_profiles
CREATE POLICY "profiles_select" ON user_profiles
  FOR SELECT USING (company_id = my_company_id());
CREATE POLICY "profiles_update_self" ON user_profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_update" ON user_profiles
  FOR UPDATE USING (company_id = my_company_id() AND my_global_role() = 'admin');

-- user_business_access
CREATE POLICY "uba_select" ON user_business_access
  FOR SELECT USING (
    user_id = auth.uid() OR my_global_role() = 'admin'
  );
CREATE POLICY "uba_insert" ON user_business_access
  FOR INSERT WITH CHECK (my_global_role() = 'admin');
CREATE POLICY "uba_update" ON user_business_access
  FOR UPDATE USING (my_global_role() = 'admin');
CREATE POLICY "uba_delete" ON user_business_access
  FOR DELETE USING (my_global_role() = 'admin');

-- pl_actuals
CREATE POLICY "pl_actuals_select" ON pl_actuals
  FOR SELECT USING (has_business_access(business_id));
CREATE POLICY "pl_actuals_insert" ON pl_actuals
  FOR INSERT WITH CHECK (has_business_access(business_id, 'editor'));
CREATE POLICY "pl_actuals_update" ON pl_actuals
  FOR UPDATE USING (has_business_access(business_id, 'editor'));
CREATE POLICY "pl_actuals_delete" ON pl_actuals
  FOR DELETE USING (has_business_access(business_id, 'admin'));

-- pl_plans
CREATE POLICY "pl_plans_select" ON pl_plans
  FOR SELECT USING (has_business_access(business_id));
CREATE POLICY "pl_plans_insert" ON pl_plans
  FOR INSERT WITH CHECK (has_business_access(business_id, 'editor'));
CREATE POLICY "pl_plans_update" ON pl_plans
  FOR UPDATE USING (has_business_access(business_id, 'editor'));

-- budgets
CREATE POLICY "budgets_select" ON budgets
  FOR SELECT USING (has_business_access(business_id));
CREATE POLICY "budgets_insert" ON budgets
  FOR INSERT WITH CHECK (has_business_access(business_id, 'editor'));
CREATE POLICY "budgets_update" ON budgets
  FOR UPDATE USING (has_business_access(business_id, 'editor'));

-- budget_items
CREATE POLICY "budget_items_select" ON budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budgets b WHERE b.id = budget_id AND has_business_access(b.business_id)
    )
  );
CREATE POLICY "budget_items_insert" ON budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b WHERE b.id = budget_id AND has_business_access(b.business_id, 'editor')
    )
  );
CREATE POLICY "budget_items_update" ON budget_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM budgets b WHERE b.id = budget_id AND has_business_access(b.business_id, 'editor')
    )
  );

-- alerts
CREATE POLICY "alerts_select" ON alerts
  FOR SELECT USING (has_business_access(business_id));
CREATE POLICY "alerts_update" ON alerts
  FOR UPDATE USING (has_business_access(business_id, 'editor'));

-- kpi_snapshots
CREATE POLICY "kpi_snapshots_select" ON kpi_snapshots
  FOR SELECT USING (has_business_access(business_id));

-- audit_logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (user_id = auth.uid() OR my_global_role() = 'admin');
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);
