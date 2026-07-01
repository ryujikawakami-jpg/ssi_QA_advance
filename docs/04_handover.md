# 開発引き継ぎドキュメント — Widsley スキルチェックアプリ

最終更新: 2026-07-01

---

## 1. プロジェクト概要

SSI事業部のスキル自己評価をExcelからWebアプリ化するプロジェクト。
4コース（Academia/テスト自動化/マネジメント/セキュリティ）127スキル対応。

**本番URL:** https://ssi-qa-advance-239789192031.asia-northeast1.run.app
**GitHub:** Widsley-Biz/ssi_QA_advance
**Supabase:** https://azjrbizzkjvemeheoohg.supabase.co

---

## 2. 技術スタック

- **フロントエンド:** React + TypeScript (Vite)
- **DB・認証:** Supabase (PostgreSQL, 東京リージョン)
- **ホスティング:** GCP Cloud Run (asia-northeast1)
- **認証:** Supabase Auth (Google OAuth, @widsley.com限定)
- **GCP:** OAuth Client ID/Secret (会社のGCPプロジェクト)

---

## 3. ディレクトリ構成

```
qa_advance/
├─ app/                          # React アプリ (git root)
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ AdminPanel.tsx       # 管理画面（ユーザー・チーム・マスタ・招待管理）
│  │  │  ├─ BoardView.tsx        # ボード画面（全社一覧・サマリー）
│  │  │  ├─ CareerMapPage.tsx    # キャリアパス画面（職種選択・ルート表示・スコープ登録）
│  │  │  ├─ CertificationPage.tsx # 資格管理画面（資格表・3ボタンステータス・バッジ）
│  │  │  ├─ CourseIntro.tsx      # コース詳細・開始画面
│  │  │  ├─ CourseSelect.tsx     # コース選択ホーム画面
│  │  │  ├─ Dashboard.tsx        # ダッシュボード（詳細・差分・推移・面談メモ）
│  │  │  ├─ Header.tsx           # ヘッダーナビ（ロール別表示）
│  │  │  ├─ LeaderView.tsx       # チームビュー（チーム選択・履歴管理モーダル）
│  │  │  ├─ LoginPage.tsx        # ログイン（Google OAuth + デモモード）
│  │  │  ├─ MyPage.tsx           # マイページ（キャリアスコープ・資格状況・スキル概要）
│  │  │  └─ QuizFlow.tsx         # 回答フロー（バブルUI・前回プリセット・途中提出）
│  │  ├─ context/
│  │  │  └─ AuthContext.tsx       # 認証（Supabase/モック両対応）
│  │  ├─ data/
│  │  │  └─ mockData.ts          # デモモード用モックデータ
│  │  ├─ lib/
│  │  │  ├─ data.ts              # データアクセス層（Supabase/モック自動切替）
│  │  │  ├─ score.ts             # スコアリングロジック
│  │  │  └─ supabase.ts          # Supabaseクライアント
│  │  └─ types/
│  │     ├─ database.ts          # Supabase DB型定義
│  │     └─ index.ts             # アプリ共通型定義
│  ├─ .env.example               # 環境変数テンプレート
│  ├─ .env.production            # 本番用Supabase接続情報（git管理外）
│  ├─ Dockerfile                 # Cloud Run用コンテナ定義
│  ├─ nginx.conf                 # SPA用nginx設定
│  └─ package.json
├─ supabase/
│  ├─ migrations/
│  │  ├─ 001_tables.sql          # テーブル定義
│  │  ├─ 002_rls.sql             # RLSポリシー
│  │  ├─ 003_views.sql           # 集計ビュー
│  │  ├─ 004_functions.sql       # 自動プロフィール作成トリガー
│  │  ├─ 005_certifications.sql  # certifications/user_certificationsテーブル
│  │  ├─ 006_invitations.sql     # invitationsテーブル
│  │  └─ 007_career_path.sql     # キャリアパス関連テーブル・ビュー
│  └─ seed/
│     └─ seed.sql                # 4コース127スキルのマスタデータ
├─ doc/
│  ├─ 03_decisions.md            # 全決定事項ログ
│  └─ 04_handover.md             # この引き継ぎドキュメント
├─ 01_requirements.md            # 要件定義書 v2.1
├─ 02_product_spec.md            # プロダクト仕様書 v2.1
└─ 【統合版】QA Advanced スキルマップ.xlsx  # スキルマスタ正本
```

---

## 4. 重要な設計判断

### データアクセス（lib/data.ts）
- `VITE_SUPABASE_URL` が設定されていればSupabase、なければモックデータを使う
- 開発時はenv未設定でデモモードで動く（Supabase不要）
- 本番は`.env.production`のenv変数でSupabase接続（ビルド時にDockerイメージに組み込み）

### 認証（AuthContext.tsx）
- Supabaseモード: `signInWithGoogle()` → Supabase Auth → profiles自動作成（004_functions.sqlのトリガー）
- デモモード: `login(userId)` → mockDataのprofilesから選択

### スコアリング（lib/score.ts）
- `calcRate()`: 加重スコア。score_excluded=trueのスキル（JSTQB）は除外。切り捨て小数第2位
- `checkGate()`: 全スキル3以上でゲート通過
- `checkAcademiaGraduation()`: JSTQB合格 AND 達成率>80%
- `getNextSkills()`: 低スコア→低難易度順で推薦
- `buildScoreSnapshot()`: 提出時のスナップショット生成

### ロール別表示
- member: 自分のデータ + 難易度★表示（重み/加重は非表示）
- leader: 自チーム全データ + 重み/加重も表示 + 履歴削除
- board: 全チーム閲覧 + チーム選択フィルタ + 管理画面 + 重み/加重表示

### 面談メモ
- localStorage保存（キー: `memo_${courseId}_${userId}`）
- 将来的にSupabaseテーブルに移行検討

---

## 5. 現在の実装状態

### 完了（本番稼働中）
- [x] Google OAuth認証（@widsley.com限定）
- [x] 4コース選択画面（概要・ゴール・達成率表示）
- [x] 回答フロー（バブルUI左小→右大、前回プリセット、binary質問、難易度★、途中提出可）
- [x] ダッシュボード（達成率リング、ゲート判定、差分比較、推移グラフ、回答詳細、面談メモ）
- [x] リーダー画面（チーム一覧、全チーム表示@board、履歴管理モーダル）
- [x] ボード画面（全社一覧、レベル別サマリー、チーム別集計）
- [x] 管理画面（ユーザー管理、チーム管理、マスタ参照、招待管理）
- [x] Supabase（テーブル・RLS・ビュー・シードデータ・自動プロフィール作成）
- [x] ホスティング移行: Vercel → GCP Cloud Run (asia-northeast1)
- [x] 資格管理画面（CertificationPage.tsx: 資格表、3ボタンステータス、報奨金バッジ）
- [x] キャリアパス画面（CareerMapPage.tsx: 職種選択、ルート表示、スコープ登録）
- [x] マイページ（MyPage.tsx: キャリアスコープ、資格状況管理）
- [x] 一括招待+GASメール送信
- [x] DB: certifications, user_certifications, invitationsテーブル（migrations 005-007）
- [x] favicon=Widsleyロゴ、title=Widsley SkillCheck

### 未実装（ネクストタスク）
- [ ] Slack Bot作成・連携実装（提出通知・催促通知）
- [ ] 面談メモのSupabaseテーブル移行（現在localStorage）
- [ ] 管理画面のスキルマスタ編集（現在は参照のみ）
- [ ] GitHubリポジトリの会社Org移行（社長承認後）
- [ ] メンバーがチームメンバーのレベルを見れるか検討（Q-03）
- [ ] カスタムドメイン設定（skillcheck.widsley.com）

### 既知の注意点
- rechartsとVite 8 (rolldown)の互換性問題でローカルビルドがエラーになることがある。Cloud Run側のビルドは問題なし
- テストユーザー（reader, member01, member02）はauth.usersに直接INSERT済み（実際のGoogleログインはできない）
- Supabase無料枠は7日間非アクティブで一時停止（100人利用なら問題なし）
- `.env.production`はgit管理外。Supabaseの`VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`を含む
- GAS招待メールURL: 管理画面の招待機能からGAS経由でメール送信。GASのWebアプリURLは`.env.production`内の`VITE_GAS_INVITE_URL`で管理

---

## 6. 開発の進め方

### ローカル開発（デモモード）
```bash
cd qa_advance/app
npm install
npm run dev    # Supabase未設定ならデモモードで起動
```

### 本番接続で開発
```bash
cp .env.example .env
# .envにVITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEYを設定
npm run dev
```

### デプロイ（GCP Cloud Run）
git pushするだけで自動デプロイ。手動コマンド不要。
- GitHub push → Cloud Build自動ビルド → Cloud Runデプロイ
- Service URL: https://ssi-qa-advance-239789192031.asia-northeast1.run.app

**注意:** `.env.production`にSupabaseの`VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が設定されている必要がある。

---

## 7. 関連ドキュメントへのポインタ

| ドキュメント | 場所 | 内容 |
|---|---|---|
| 要件定義書 v3.0 | `01_requirements.md` | 全機能要件・非機能要件 |
| プロダクト仕様書 v3.0 | `02_product_spec.md` | DB設計・画面仕様・実装ステップ |
| 決定事項ログ | `doc/03_decisions.md` | 全8カテゴリの決定事項（採点・ステージ・権限・認証・DB・インフラ・UX・運用） |
| スキルマスタ正本 | `【統合版】QA Advanced スキルマップ.xlsx` | 4コース127スキルの重み・難易度・説明 |
| Notion | システムドキュメントまとめ > スキルチェックアプリ | プロジェクト概要・進捗・残タスク |
