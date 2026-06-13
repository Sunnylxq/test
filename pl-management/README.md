# 経営管理システム — PL Manager

Next.js + TypeScript + Tailwind + Supabase + Recharts で構築した多事業PL管理ダッシュボード。

## 機能

- 📊 **Dashboard** — KPIカード / 月次チャート / アラートパネル / 達成率進捗
- 📈 **事業別分析** — 売上・利益・利益率・前年比チャート
- 🏆 **ランキング** — 売上 / 利益 / 利益率 / 成長率 自動ソート
- 🔮 **年度予測** — 直近3ヶ月ペースで年末着地を自動推計
- ✏️ **PL入力** — 実績 / 計画 月次入力 + 自動計算
- 🔔 **アラート** — 売上未達 / 利益率低下 / 超過達成 を自動検知
- 👥 **ユーザー管理** — Admin / Editor / Viewer + 事業別アクセス制御

## セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.local.example .env.local
# Supabase URL / ANON KEY を入力

# 3. DB マイグレーション (Supabase Dashboard または CLI)
# supabase/migrations/ を順番に実行

# 4. シードデータ投入
# supabase/migrations/003_seed_data.sql を実行

# 5. 開発サーバー起動
npm run dev
```

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| バックエンド / Auth | Supabase |
| チャート | Recharts |
| 状態管理 | Zustand |

## ロール

| ロール | 権限 |
|--------|------|
| Admin | 全操作（ユーザー管理 / 設定 含む） |
| Editor | PL入力・計画入力・閲覧 |
| Viewer | 閲覧のみ |
