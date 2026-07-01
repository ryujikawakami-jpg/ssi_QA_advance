# プロダクト仕様書 — Widsley スキルチェックアプリ

| 項目 | 内容 |
|---|---|
| ドキュメント名 | スキルチェックアプリ プロダクト仕様書 |
| バージョン | v3.0 |
| 関連文書 | スキルチェックアプリ 要件定義書 v3.0 / 決定事項ログ 03_decisions.md |
| 想定実装 | React + TypeScript / Supabase / GCP Cloud Run |
| 更新日 | 2026-07-01 |

本書は要件定義書を実装可能な粒度に落とし込んだもので、Claude Code等での実装着手を想定している。

---

## 1. システム全体像

```
[ブラウザ(PC/スマホ)] --HTTPS--> [GCP Cloud Run: React/TS SPA（asia-northeast1）]
        |                              |
        |  Supabase JS Client (認証/データ)
        v                              v
   [Supabase Auth(Google)]      [Supabase Postgres + RLS]
        @widsley.com限定            東京リージョン
                                       |
                               (将来) 学習ツール連携
                                       |
                               [Slack Bot] ← 回答通知・催促通知（後期実装）
```

- フロントはSPA。Supabase JSクライアントから認証・データ取得を行う
- ビジネスロジック（スコア計算）はフロントで実行し、集計の重い処理はDBのビュー／RPCに寄せる
- アクセス制御はRLS（行レベルセキュリティ）でDB側に集約する
- Supabaseとの接続は`lib/supabase.ts`に集約し、将来の移行に備える

---

## 2. データモデル（Supabase / PostgreSQL）

### 2.1 ER概要

```
courses 1---* levels 1---* skills
teams   1---* users(profiles)
users   1---* assessments 1---* answers *---1 skills
```

### 2.2 テーブル定義

### courses（コースマスタ）
| カラム | 型 | 説明 |
|---|---|---|
| id | text PK | 'academia' / 'automation' / 'management' / 'security' |
| name | text | 表示名 |
| type | text | 'single'（単一ステージ）/ 'leveled'（レベル制） |
| goal | text | コースのゴール文 |
| description | text | コース概要（コース選択画面用） |
| sort_order | int | 表示順 |

### levels（レベル／カテゴリマスタ）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| course_id | text FK→courses | |
| name | text | 'Entry'/'Associate'… または Academiaのカテゴリ('土台'等) |
| sort_order | int | 表示順 |
| kind | text | 'level'（ゲート対象）/ 'category'（集計のみ） |

※ Academiaは type='single'。levels.kind='category' として「土台/QA知識/QA実務/案件経験/ゴール」を保持
※ セキュリティはEntryなし。Associate/Professional/Expertの3段階

### skills（スキルマスタ）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| course_id | text FK | |
| level_id | bigint FK→levels | |
| no | int | コース内の通し番号 |
| category | text | カテゴリ（表示用） |
| name | text | スキル名 |
| description | text | スキル説明 |
| weight | numeric | 重み（＝難易度） |
| importance | int | 推奨度（☆の数 / null可） |
| ref_note | text | JSTQB対応章 等（任意） |
| answer_type | text | 'scale5'（5段階、デフォルト）/ 'binary'（合格/まだ） |
| score_excluded | boolean | trueの場合、達成率計算から除外（JSTQB合格用） |

### teams（チームマスタ）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| name | text | チーム名（UNIQUE） |

### profiles（ユーザー；auth.usersと1:1）
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK FK→auth.users | |
| display_name | text | 氏名（Google自動取得） |
| email | text | メールアドレス（Google自動取得） |
| role | text | 'member'/'leader'/'board'/'retired' |
| team_id | bigint FK→teams (nullable) | 未割当はnull |
| slack_id | text (nullable) | Slack連携用ID |

※ `current_stage`カラムは不要（assessmentsから自動算出）

### assessments（自己評価の実施単位＝履歴）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| user_id | uuid FK→profiles | |
| course_id | text FK→courses | |
| status | text | 'submitted'（毎回submittedで新規作成。draftは使わない） |
| submitted_at | timestamptz | 提出日時 |
| created_at | timestamptz | |
| score_snapshot | jsonb | 提出時の達成率・レベル判定結果のスナップショット |

score_snapshot例：
```json
{
  "rate": 72.34,
  "reached_level": "Associate",
  "jstqb_passed": true,
  "academia_graduated": false,
  "level_gates": {
    "Entry": true,
    "Associate": true,
    "Professional": false
  }
}
```

### answers（個別回答）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| assessment_id | bigint FK→assessments | |
| skill_id | bigint FK→skills | |
| score | int | 1〜5（binary型の場合: 5=合格, 1=まだ） |

一意制約：answers(assessment_id, skill_id)。

### invitations（招待管理）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| email | text | 招待先メールアドレス |
| role | text | 事前設定ロール |
| team_id | bigint FK→teams | 事前設定チーム |
| invited_by | uuid FK→profiles | 招待した管理者 |
| status | text | 'pending'/'accepted' |
| created_at | timestamptz | |

### certifications（資格マスタ）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| name | text | 資格名 |
| category | text | 分類（例: IT基礎、セキュリティ、クラウド等） |
| has_reward | boolean | 報奨金対象かどうか |
| reward_amount | int (nullable) | 報奨金額（対象外はnull） |
| career_path_id | text (nullable) | 紐づくキャリアパス（nullable） |
| sort_order | int | 表示順 |

### user_certifications（ユーザー資格状況）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigint PK | |
| user_id | uuid FK→profiles | |
| certification_id | bigint FK→certifications | |
| status | text | 'not_started'（未取得）/ 'studying'（勉強中）/ 'acquired'（取得済み） |
| acquired_at | date (nullable) | 取得日（取得済みの場合） |
| updated_at | timestamptz | |

一意制約：user_certifications(user_id, certification_id)。

### 2.3 集計ビュー（例）

- `v_assessment_score`：assessmentごとに加重スコア・満点・達成率を返す
- `v_level_gate`：assessment × levelごとに gate(bool)・rate(%) を返す
- `v_team_summary`：team × course × level の人数・平均達成率を返す

集計はビュー or RPC（Postgres関数）で提供し、フロントはそれを読むだけにする。

---

## 3. アクセス制御（RLS方針）

| テーブル | member | leader | board | retired |
|---|---|---|---|---|
| courses/levels/skills | 全件read | 全件read | read/write(管理) | アクセス不可 |
| profiles | 自分read + 自チーム名前のみ | 自team read | 全件read/write | アクセス不可 |
| assessments/answers | 自分のみ read/write | 自team read + 削除可 | 全件read + 削除可 | アクセス不可 |
| teams | 自チームread | 自チームread | 全件read/write | アクセス不可 |

- RLSはprofiles.role と team_id を参照して判定する
- retiredロールはすべてのデータアクセスを拒否（ログイン自体もブロック推奨）
- メンバーが自チームメンバーのレベルを見れるかは後日検討

---

## 4. スコアリング仕様（実装ロジック）

### 4.1 達成率（共通）
```
対象skills = course.skills.filter(s => !s.score_excluded)
max  = Σ(skill.weight * 5)        // 対象スキル群
got  = Σ(skill.weight * score)    // 未回答は0
rate = Math.floor(got / max * 10000) / 100   // 切り捨て、小数第2位
```

### 4.2 ゲート判定
```
allAnswered = （対象スキルが全て回答済み）
allAbove3   = （全スキルのscore >= 3）
gate        = allAnswered && allAbove3
```

### 4.3 到達レベル（leveledコース）
```
reached = '未到達'
for level in [Entry, Associate, Professional, Expert]:
    if level.gate: reached = level.name
    else: break          // 途中で閉じたら止める
```
※ セキュリティはAssociateから開始

### 4.4 Academia（singleコース）
- JSTQB FL合格は別軸（score_excluded=true）
- 達成率はJSTQB以外の20スキルで計算
- 卒業条件：**JSTQB FL合格 AND 達成率 > 80%**
- 表示：「Academia卒業（JSTQB FL取得済み）」or「Academia生」
- 卒業後も再回答可能（ロックしない）

### 4.5 「次に伸ばすスキル」ロジック
```
candidates = skills.filter(s => s.score < 3)  // 低スコアのもの
sorted = candidates.sort((a,b) => a.weight - b.weight)  // 重み（難易度）が低い順
recommend = sorted.slice(0, 5)  // 上位5件
```
- メンバー画面では重みを「難易度(★)」として表示（weight/加重スコアは非表示）
- リーダー／ボード画面では重み・加重スコアを両方表示

### 4.6 スコアスナップショット
- 提出時にassessments.score_snapshotに計算結果を保存
- 過去の履歴は提出時点の値がそのまま残る（マスタ変更の影響を受けない）

---

## 5. 画面仕様

### 5.1 共通
- ヘッダ：ロゴ、コース切替、ログインユーザー（到達レベルバッジ表示）
- レスポンシブ：スマホ幅で1カラム
- ブランドカラー：Widsleyブランドカラー
  - メインベース: Deep Blue #03202F
  - ハイライト: Cyan #3DB7E4 / Sea Green #50DAB0
  - グラデーション: Sea Green→Cyan
  - アクセント: Magenta #E21776

### 5.2 メンバー画面

### (a) コース選択画面
- 4コース（Academia/テスト自動化/マネジメント/セキュリティ）をカード形式で表示
- 各カードにコース名・概要・ゴールを表示
- 「複数コースを同時に進められます」の案内を表示
- 各コースの現在の到達レベル・達成率をカードに表示

### (b) 回答フロー（16personalities.com スタイル）
- 1問ずつ表示：スキル名、説明、カテゴリ／レベルのタグ、難易度(★)、（あれば）参考章
- 横並びの5つの丸（バブル）で選択する方式（左小→右大）
  - 左端（小）→ 右端（大）のグラデーション的サイズ変化
  - 左端: 1 興味はある（学習意欲がある）
  - 左寄り: 2 知識はある（実務経験はない）
  - 中央: 3 指導があれば（実行できる）
  - 右寄り: 4 独力でできる（標準的な成果を出せる）
  - 右端: 5 人に教えられる（効率化・改善も提案できる）
- JSTQB FL合格のみ「合格」「まだ」の2択ボタン
- 選択時にWidsleyブランドカラーで塗りつぶし
- 選択すると自動的に次の問へ進む。上部に進捗バー。前の問に戻る操作も可
- 2回目以降は前回回答がプリセット
- 全問回答しなくても提出可能

### (c) ダッシュボード
- 総合達成率リング
- 【single】カテゴリ別達成率バー＋卒業条件判定＋次に伸ばすスキル
- 【leveled】到達レベル＋各レベルのゲート判定バッジ＋達成率バー
- 「詳細」ボタン → 各問の回答内容一覧（スキル名・スキル説明・回答スコア・難易度(★)）。リーダー／ボード画面では重み・加重スコアも表示
- メンバー画面ではweight/加重スコアを非表示にし、難易度(★)のみ表示
- 面談メモ用textarea（リーダー画面、localStorageに保存）
- スキル説明（description）を回答詳細ビューに表示
- 説明・ゴール等のテキストは左寄せ（left-aligned）で可読性を確保
- 2回目以降は前回差分比較表示（どのスキルが上がった/下がったか）
- 推移グラフ（過去のsubmitted達成率、X軸：提出日、Y軸：達成率）
- 提出履歴一覧

### (d) 未割当状態画面
- チーム未割当の場合「管理者に連絡してください」バナー表示
- コース回答は可能

### 5.3 リーダー画面
- 自チームメンバー一覧（氏名・到達レベル・達成率・最終更新日）
- boardロールを兼務するリーダーは全チームを閲覧可能（チームセレクタードロップダウンで切替）
- メンバー選択でメンバーと同じダッシュボード・回答詳細を参照
- 面談用：強み／次に伸ばすスキルの要約
- 面談メモ用textarea（localStorageに保存、メンバーごと）
- 提出履歴の削除機能（コース単位・提出単位の選択削除をモーダルで実施）

### 5.4 ボード画面
- 全社得点一覧（フィルタ：コース・チーム）
- レベル別人数サマリー（各レベルの人数）
- チーム別・コース別の平均達成率

### 5.5 管理画面（board）
- **マスタ管理**：コース・レベル・スキル・重みの参照・編集
- **ユーザー管理**：ロール割り当て・チーム振り分け
- **チーム管理**：チーム新規登録・名前編集・リーダー設定
- **Slack連携**：メンバーのSlack ID設定
- **通知**：四半期回答催促の送信
- **履歴管理**：提出履歴の削除
- **バリデーション**：チーム名（空文字・重複）、スキルマスタ（重みは正の数値、名前は空文字不可）、ロール変更時の確認ダイアログ
- **招待管理**：最大10件の一括招待フォーム、メール+ロール+チーム設定、GAS経由で招待メール自動送信、invitationsテーブルで事前登録→初回ログイン時に自動紐付け

### 5.6 キャリアパス画面
- 職種選択：対象の職種（QAエンジニア、テスト自動化エンジニア、セキュリティエンジニア等）を選択
- ルート表示：選択した職種のキャリアステップ（Entry→Associate→Professional→Expert）をビジュアル表示
- スコープ登録：自分が目指すキャリアパスのスコープを登録
- 資格連携：キャリアパスに紐づく推奨資格を表示（報奨金対象外含む）
- マイページ連携：登録したスコープがマイページに反映

### 5.7 資格管理画面
- 資格表：報奨金対象資格の一覧を表示（報奨金額付き）
- キャリアパス推奨資格：報奨金対象外を含む全推奨資格を表示
- ステータス選択：3ボタンモーダル（未取得／勉強中／取得済み）で資格ステータスを更新
- バッジ表示：報奨金対象資格は報奨金バッジ、対象外は推奨バッジで区別

### 5.8 マイページ
- キャリアスコープ：登録済みのキャリアパススコープを表示・編集
- 資格ステータス管理：自分の資格取得状況（未取得／勉強中／取得済み）の一覧と更新
- スキルチェック概要：各コースの達成率・到達レベルのサマリー表示

---

## 6. 初期データ（マスタ投入）

本リリースのスキルマスタは統合版スキルマップExcelから抽出済み。

| コース | 件数 | 構成 |
|---|---|---|
| Academia（共通ベース） | 21 | 土台4 / QA知識7 / QA実務4 / 案件経験4 / ゴール2（type=single）。うちJSTQB合格は別軸 |
| テスト自動化 | 35 | Entry5 / Associate8 / Professional17 / Expert5（type=leveled） |
| マネジメント | 41 | Entry10 / Associate10 / Professional11 / Expert10（type=leveled） |
| セキュリティ | 30 | Associate10 / Professional10 / Expert10（type=leveled、Entryなし） |

各スキルは name / description / weight / category / importance / ref_note / answer_type / score_excluded を保持する。

---

## 7. ディレクトリ構成（想定）

```
/ (GitHub repo)
├─ app/                 # React + TS (Vite)
│  ├─ src/
│  │  ├─ pages/         # コース選択、回答、ダッシュボード、リーダー、ボード、管理
│  │  ├─ components/    # Ring, QuizCard, Dashboard, TeamTable, AdminPanel ...
│  │  ├─ lib/
│  │  │  ├─ score.ts    # スコアリングロジック
│  │  │  └─ supabase.ts # Supabaseクライアント初期化（移行対策で集約）
│  │  └─ types/
│  ├─ public/
│  ├─ Dockerfile        # Cloud Run用コンテナ定義
│  └─ nginx.conf        # SPA用nginx設定
├─ supabase/
│  ├─ migrations/       # テーブル・RLS・ビュー定義(SQL)
│  └─ seed/             # courses/levels/skills 投入データ
├─ doc/                 # 要件定義書・仕様書・決定事項ログ
└─ README.md
```

---

## 8. 実装ステップ（推奨順）

1. Supabaseプロジェクト作成（東京リージョン）、Google Auth設定（@widsley.com）
2. migrations：courses/levels/skills/teams/profiles/assessments/answers を作成（current_stageなし）
3. seed：4コース127スキルを投入（統合版スキルマップExcelより）
4. RLSポリシー設定（3章）＋ 集計ビュー作成
5. フロント雛形（Vite + TS + Supabase client）、ログイン
6. コース選択画面（概要・ゴール表示、複数コース同時進行案内）
7. メンバー：回答フロー（前回回答プリセット、JSTQB 2択、全問未回答でも提出可）＋ダッシュボード
8. 回答詳細・差分比較・推移グラフ
9. リーダー：チーム一覧・メンバーダッシュボード参照・履歴削除
10. ボード：全社一覧・レベル別サマリー
11. 管理画面：マスタ管理・ユーザー管理・チーム管理
12. GCP Cloud Runデプロイ: git push → Cloud Build自動ビルド → Cloud Runデプロイ（手動コマンド不要）
    - Service URL: https://ssi-qa-advance-239789192031.asia-northeast1.run.app
13. （後期）Slack連携：Bot作成、通知機能実装

---

## 9. 将来拡張（本リリース対象外）

- キャリアマップ画面の拡張：到達レベルを地図上にハイライト
- 学習ツール連携：スキルごとに推奨教材を紐づけ、達成率と同期
- 評価の承認フロー（リーダー確認・コメント）
- チームメンバーのレベル表示の是非（後日検討事項）
