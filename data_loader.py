import pandas as pd
import numpy as np
import os
from functools import lru_cache

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _safe(v):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return 0
    return v


def _parse_month_code(code):
    """Normalize month code to YYYYMM int."""
    code = int(code)
    if code > 200000:  # YYYYMM format (202501)
        return code
    else:  # YYMM format (2501)
        year = 2000 + code // 100
        month = code % 100
        return year * 100 + month


def _load_wechat():
    records = []
    for year, fname, sheet, jan_col, brand_col, name_col, code_col in [
        (2025, "wechat_2025.xlsx", "2025累計", "JANコード", "ブランド", "商品名称", "商品符号"),
        (2026, "wechat_2026.xlsx", "2026累計", "JANコード", "ブランド", "商品名称", "商品符号"),
    ]:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path):
            continue
        df = pd.read_excel(path, sheet_name=sheet, header=[0, 1])

        # Find month columns
        month_cols = {}
        for col in df.columns:
            top = col[0]
            sub = col[1]
            try:
                v = float(str(top).strip())
                if not np.isnan(v) and 2000 < v < 300000:
                    mc = _parse_month_code(int(v))
                    if sub in ("数量", "金額"):
                        month_cols.setdefault(mc, {})[sub] = col
            except (ValueError, TypeError):
                pass

        # Find meta columns by top-level name
        def find_col(name):
            for c in df.columns:
                if str(c[0]).strip() == name:
                    return c
            return None

        col_jan = find_col(jan_col)
        col_brand = find_col(brand_col)
        col_name = find_col(name_col)
        col_code = find_col(code_col)

        for _, row in df.iterrows():
            brand = str(row[col_brand]).strip() if col_brand else ""
            product = str(row[col_name]).strip() if col_name else ""
            jan = str(row[col_jan]).strip() if col_jan else ""
            code = str(row[col_code]).strip() if col_code else ""

            if not brand or brand in ("nan", "ブランド", "None"):
                continue

            for mc, subs in month_cols.items():
                qty = _safe(row.get(subs.get("数量", None), 0))
                amt = _safe(row.get(subs.get("金額", None), 0))
                if qty == 0 and amt == 0:
                    continue
                records.append({
                    "store": "wechat",
                    "yyyymm": mc,
                    "year": mc // 100,
                    "month": mc % 100,
                    "brand": brand,
                    "product": product,
                    "jan": jan,
                    "code": code,
                    "qty": float(qty),
                    "amount": float(amt),
                })

    return records


def _load_novarca():
    records = []

    # NOVARCA 2025
    path = os.path.join(DATA_DIR, "novarca_2025.xlsx")
    if os.path.exists(path):
        df = pd.read_excel(path, sheet_name="アイテム別実績", header=[0, 1])

        month_cols = {}
        for col in df.columns:
            top = col[0]
            sub = col[1]
            try:
                v = float(str(top).strip())
                if not np.isnan(v) and v > 200000:
                    mc = _parse_month_code(int(v))
                    if sub in ("数量", "金額"):
                        month_cols.setdefault(mc, {})[sub] = col
            except (ValueError, TypeError):
                pass

        def find_col(name):
            for c in df.columns:
                if str(c[0]).strip() == name:
                    return c
            return None

        col_brand = find_col("ブランド")
        col_name = find_col("商品")

        for _, row in df.iterrows():
            brand = str(row[col_brand]).strip() if col_brand else ""
            product = str(row[col_name]).strip() if col_name else ""

            if not brand or brand in ("nan", "ブランド", "None"):
                continue

            for mc, subs in month_cols.items():
                qty = _safe(row.get(subs.get("数量", None), 0))
                amt = _safe(row.get(subs.get("金額", None), 0))
                if qty == 0 and amt == 0:
                    continue
                records.append({
                    "store": "novarca",
                    "yyyymm": mc,
                    "year": mc // 100,
                    "month": mc % 100,
                    "brand": brand,
                    "product": product,
                    "jan": "",
                    "code": "",
                    "qty": float(qty),
                    "amount": float(amt),
                })

    # NOVARCA 2026
    path = os.path.join(DATA_DIR, "novarca_2026.xlsx")
    if os.path.exists(path):
        df = pd.read_excel(path, sheet_name="月別詳細", header=[0, 1])

        month_cols = {}
        for col in df.columns:
            top = col[0]
            sub = col[1]
            try:
                v = float(str(top).strip())
                if not np.isnan(v) and 2000 < v < 300000:
                    mc = _parse_month_code(int(v))
                    if sub in ("数量", "金額"):
                        month_cols.setdefault(mc, {})[sub] = col
            except (ValueError, TypeError):
                pass

        def find_col(name):
            for c in df.columns:
                if str(c[0]).strip() == name:
                    return c
            return None

        col_brand = find_col("ブランド")
        col_name = find_col("商品名称")
        col_code = find_col("商品符号")

        for _, row in df.iterrows():
            brand = str(row[col_brand]).strip() if col_brand else ""
            product = str(row[col_name]).strip() if col_name else ""
            code = str(row[col_code]).strip() if col_code else ""

            if not brand or brand in ("nan", "ブランド", "None"):
                continue

            for mc, subs in month_cols.items():
                qty = _safe(row.get(subs.get("数量", None), 0))
                amt = _safe(row.get(subs.get("金額", None), 0))
                if qty == 0 and amt == 0:
                    continue
                records.append({
                    "store": "novarca",
                    "yyyymm": mc,
                    "year": mc // 100,
                    "month": mc % 100,
                    "brand": brand,
                    "product": product,
                    "jan": "",
                    "code": code,
                    "qty": float(qty),
                    "amount": float(amt),
                })

    return records


_cache = {}


def get_store_df(store: str) -> pd.DataFrame:
    if store in _cache:
        return _cache[store]

    if store == "wechat":
        records = _load_wechat()
    else:
        records = _load_novarca()

    df = pd.DataFrame(records)
    _cache[store] = df
    return df


def invalidate_cache():
    _cache.clear()


def get_analytics(store: str, current_yyyymm: int = None) -> dict:
    df = get_store_df(store)
    if df.empty:
        return {}

    if current_yyyymm is None:
        current_yyyymm = int(df["yyyymm"].max())

    cur_year = current_yyyymm // 100
    cur_month = current_yyyymm % 100
    prev_yyyymm = (cur_year - 1) * 100 + cur_month
    prev_month_yyyymm = current_yyyymm - 1 if cur_month > 1 else (cur_year - 1) * 100 + 12

    # --- Dashboard ---
    this_month_amt = float(df[df["yyyymm"] == current_yyyymm]["amount"].sum())
    prev_year_month_amt = float(df[df["yyyymm"] == prev_yyyymm]["amount"].sum())
    prev_month_amt = float(df[df["yyyymm"] == prev_month_yyyymm]["amount"].sum())

    cur_year_df = df[df["year"] == cur_year]
    cumulative_amt = float(cur_year_df["amount"].sum())
    brand_count = int(cur_year_df["brand"].nunique())
    sku_count = int(cur_year_df["product"].nunique())

    yoy = ((this_month_amt - prev_year_month_amt) / prev_year_month_amt * 100) if prev_year_month_amt else None
    mom = ((this_month_amt - prev_month_amt) / prev_month_amt * 100) if prev_month_amt else None

    dashboard = {
        "current_yyyymm": current_yyyymm,
        "this_month_amount": this_month_amt,
        "cumulative_amount": cumulative_amt,
        "brand_count": brand_count,
        "sku_count": sku_count,
        "yoy": yoy,
        "mom": mom,
    }

    # --- Brand monthly ranking ---
    brand_monthly = (
        df.groupby(["yyyymm", "brand"])["amount"]
        .sum()
        .reset_index()
        .sort_values(["yyyymm", "amount"], ascending=[True, False])
    )
    brand_monthly["rank"] = brand_monthly.groupby("yyyymm")["amount"].rank(ascending=False, method="first").astype(int)

    all_months = sorted(df["yyyymm"].unique().tolist())
    brand_monthly_dict = {}
    for ym in all_months:
        sub = brand_monthly[brand_monthly["yyyymm"] == ym]
        total = sub["amount"].sum()
        brand_monthly_dict[str(ym)] = [
            {
                "rank": int(r["rank"]),
                "brand": r["brand"],
                "amount": float(r["amount"]),
                "share": float(r["amount"] / total * 100) if total else 0,
            }
            for _, r in sub.iterrows()
        ]

    # --- Cumulative brand ranking (current year) ---
    brand_cum = (
        cur_year_df.groupby("brand")["amount"]
        .sum()
        .reset_index()
        .sort_values("amount", ascending=False)
    )
    total_cum = brand_cum["amount"].sum()
    brand_cum["rank"] = range(1, len(brand_cum) + 1)
    brand_cum["share"] = brand_cum["amount"] / total_cum * 100 if total_cum else 0

    # Prev year rank for comparison
    prev_year_df = df[df["year"] == cur_year - 1]
    prev_brand_cum = (
        prev_year_df.groupby("brand")["amount"]
        .sum()
        .reset_index()
        .sort_values("amount", ascending=False)
    )
    prev_brand_cum["prev_rank"] = range(1, len(prev_brand_cum) + 1)
    prev_rank_map = dict(zip(prev_brand_cum["brand"], prev_brand_cum["prev_rank"]))

    cumulative_brand_ranking = []
    for _, r in brand_cum.iterrows():
        prev_rank = prev_rank_map.get(r["brand"])
        rank_change = (prev_rank - int(r["rank"])) if prev_rank else None
        cumulative_brand_ranking.append({
            "rank": int(r["rank"]),
            "brand": r["brand"],
            "amount": float(r["amount"]),
            "share": float(r["share"]),
            "rank_change": rank_change,
        })

    # --- Brand trend (monthly amount per brand, current year) ---
    brands_top = [r["brand"] for r in cumulative_brand_ranking[:10]]
    months_cur = sorted(cur_year_df["yyyymm"].unique().tolist())
    brand_trend = {}
    for b in brands_top:
        bdf = cur_year_df[cur_year_df["brand"] == b]
        brand_trend[b] = {
            str(m): float(bdf[bdf["yyyymm"] == m]["amount"].sum())
            for m in months_cur
        }

    # --- Monthly TOP10 products ---
    product_monthly_top10 = {}
    for ym in all_months:
        sub = df[df["yyyymm"] == ym]
        top = (
            sub.groupby("product")
            .agg(qty=("qty", "sum"), amount=("amount", "sum"), brand=("brand", "first"), jan=("jan", "first"), code=("code", "first"))
            .reset_index()
            .sort_values("amount", ascending=False)
            .head(10)
            .reset_index(drop=True)
        )
        product_monthly_top10[str(ym)] = [
            {
                "rank": i + 1,
                "product": r["product"],
                "brand": r["brand"],
                "jan": r["jan"],
                "code": r["code"],
                "qty": float(r["qty"]),
                "amount": float(r["amount"]),
            }
            for i, (_, r) in enumerate(top.iterrows())
        ]

    # --- Cumulative TOP10 products ---
    cum_products = (
        cur_year_df.groupby("product")
        .agg(qty=("qty", "sum"), amount=("amount", "sum"), brand=("brand", "first"), jan=("jan", "first"), code=("code", "first"))
        .reset_index()
        .sort_values("amount", ascending=False)
        .head(10)
        .reset_index(drop=True)
    )
    cumulative_top10 = [
        {
            "rank": i + 1,
            "product": r["product"],
            "brand": r["brand"],
            "jan": r["jan"],
            "code": r["code"],
            "qty": float(r["qty"]),
            "amount": float(r["amount"]),
        }
        for i, (_, r) in enumerate(cum_products.iterrows())
    ]

    # --- Monthly summary for chart ---
    monthly_summary = {}
    for ym in all_months:
        monthly_summary[str(ym)] = float(df[df["yyyymm"] == ym]["amount"].sum())

    return {
        "dashboard": dashboard,
        "brand_monthly": brand_monthly_dict,
        "cumulative_brand_ranking": cumulative_brand_ranking,
        "brand_trend": brand_trend,
        "product_monthly_top10": product_monthly_top10,
        "cumulative_top10": cumulative_top10,
        "monthly_summary": monthly_summary,
        "months": [str(m) for m in all_months],
        "brands": sorted(df["brand"].unique().tolist()),
    }


def get_key_product_data(store: str, keywords: list) -> dict:
    df = get_store_df(store)
    if df.empty or not keywords:
        return {}

    result = {}
    all_months = sorted(df["yyyymm"].unique().tolist())

    for kw in keywords:
        mask = df["product"].str.contains(kw, case=False, na=False) | \
               df["brand"].str.contains(kw, case=False, na=False)
        sub = df[mask]
        if sub.empty:
            continue

        monthly = {}
        for ym in all_months:
            s = sub[sub["yyyymm"] == ym]
            monthly[str(ym)] = {"qty": float(s["qty"].sum()), "amount": float(s["amount"].sum())}

        # YoY by month
        yoy = {}
        for ym in all_months:
            year = ym // 100
            month = ym % 100
            prev_ym = (year - 1) * 100 + month
            cur_amt = monthly[str(ym)]["amount"]
            prev_sub = sub[sub["yyyymm"] == prev_ym]
            prev_amt = float(prev_sub["amount"].sum())
            if prev_amt:
                yoy[str(ym)] = (cur_amt - prev_amt) / prev_amt * 100
            else:
                yoy[str(ym)] = None

        result[kw] = {
            "monthly": monthly,
            "yoy": yoy,
            "cumulative": float(sub["amount"].sum()),
        }

    return result
