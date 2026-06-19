import type { Course, Level, Skill, Team, Profile, Assessment, Answer } from '../types';

// ── Courses ──
export const courses: Course[] = [
  {
    id: 'academia',
    name: 'Academia（共通ベース）',
    type: 'single',
    goal: 'JSTQB Foundation Level 合格 → Entryへ昇格',
    description: '研修で基礎を学び、案件を通してIT知識と経験を増やす',
    sort_order: 1,
  },
  {
    id: 'automation',
    name: 'テスト自動化トラック',
    type: 'leveled',
    goal: '技術のスペシャリスト・組織のリーダー・インフラ領域へ自動化の幅を広げる',
    description: 'テスト自動化の基礎から高度な設計・戦略まで段階的に習得するコース',
    sort_order: 2,
  },
];

// ── Levels ──
export const levels: Level[] = [
  // Academia categories
  { id: 101, course_id: 'academia', name: '土台', sort_order: 1, kind: 'category' },
  { id: 102, course_id: 'academia', name: 'QA知識', sort_order: 2, kind: 'category' },
  { id: 103, course_id: 'academia', name: 'QA実務', sort_order: 3, kind: 'category' },
  { id: 104, course_id: 'academia', name: '案件経験', sort_order: 4, kind: 'category' },
  { id: 105, course_id: 'academia', name: 'ゴール', sort_order: 5, kind: 'category' },
  // テスト自動化 levels
  { id: 201, course_id: 'automation', name: 'Entry', sort_order: 1, kind: 'level' },
  { id: 202, course_id: 'automation', name: 'Associate', sort_order: 2, kind: 'level' },
  { id: 203, course_id: 'automation', name: 'Professional', sort_order: 3, kind: 'level' },
  { id: 204, course_id: 'automation', name: 'Expert', sort_order: 4, kind: 'level' },
];

// ── Skills ──
// Academia: skills 1–21, テスト自動化: skills 22–56

let skillId = 0;
const sk = (
  course_id: string, level_id: number, no: number, category: string,
  name: string, description: string, weight: number,
  importance: number | null = null, ref_note: string | null = null,
): Skill => ({ id: ++skillId, course_id, level_id, no, category, name, description, weight, importance, ref_note });

// Category-to-level_id mapping for academia
const academiaCatMap: Record<string, number> = { '土台': 101, 'QA知識': 102, 'QA実務': 103, '案件経験': 104, 'ゴール': 105 };
// Level-to-level_id mapping for automation
const autoLevelMap: Record<string, number> = { 'Entry': 201, 'Associate': 202, 'Professional': 203, 'Expert': 204 };

export const skills: Skill[] = [
  // ══════════════════════════════════════
  // Academia（共通ベース）— 21 skills
  // ══════════════════════════════════════

  // ── 土台 (4) ──
  sk('academia', academiaCatMap['土台'], 1, '土台',
    'ビジネスマナー・社会人基礎',
    '挨拶・身だしなみ・時間管理など社会人としての基本姿勢を実践できる',
    1.0, null, ''),
  sk('academia', academiaCatMap['土台'], 2, '土台',
    'ITリテラシー',
    'OS・ブラウザ・端末・ファイル操作などPCの基本操作ができる',
    1.0, null, ''),
  sk('academia', academiaCatMap['土台'], 3, '土台',
    '学習習慣',
    '分からない用語を自分で調べ、メモに残して学ぶ習慣がある',
    1.0, null, ''),
  sk('academia', academiaCatMap['土台'], 4, '土台',
    'ドキュメント読解',
    '仕様書・手順書を読み、不明点を質問して理解できる',
    1.0, null, ''),

  // ── QA知識 (7) ──
  sk('academia', academiaCatMap['QA知識'], 5, 'QA知識',
    'テストの基礎',
    'テストの目的・7原則・テストプロセスの基本を理解している',
    2.0, null, '第1章 テストの基礎'),
  sk('academia', academiaCatMap['QA知識'], 6, 'QA知識',
    'SDLCとテスト',
    '開発モデルとテストレベル・テストタイプの関係を理解している',
    1.5, null, '第2章 SDLC全体を通してのテスト'),
  sk('academia', academiaCatMap['QA知識'], 7, 'QA知識',
    '静的テスト',
    'レビューの種類と静的テストの考え方を理解している',
    1.0, null, '第3章 静的テスト'),
  sk('academia', academiaCatMap['QA知識'], 8, 'QA知識',
    'テスト技法(ブラックボックス)',
    '同値分割・境界値分析・デシジョンテーブル等の技法と、それを使ったテスト設計の考え方を理解している',
    2.5, null, '第4章 テスト分析と設計'),
  sk('academia', academiaCatMap['QA知識'], 9, 'QA知識',
    'テスト技法(ホワイトボックス/経験)',
    '命令網羅・分岐網羅や経験ベース技法の考え方を理解している',
    1.5, null, '第4章 テスト分析と設計'),
  sk('academia', academiaCatMap['QA知識'], 10, 'QA知識',
    'テストマネジメント基礎',
    'テスト計画・進捗・リスク・欠陥マネジメントの基本概念を理解している',
    1.5, null, '第5章 テストマネジメント'),
  sk('academia', academiaCatMap['QA知識'], 11, 'QA知識',
    'テストツール基礎',
    'テスト支援ツールの分類・利点・リスクを理解している',
    1.0, null, '第6章 テストツール'),

  // ── QA実務 (4) ──
  sk('academia', academiaCatMap['QA実務'], 12, 'QA実務',
    'テスト実施(指導下)',
    'OJTで学んだ手順に沿ってテストを実施し、合否を記録できる（指導下）',
    1.5, null, ''),
  sk('academia', academiaCatMap['QA実務'], 13, 'QA実務',
    'テスト設計理解(OJT)',
    'OJTでテスト観点・テストケースの作られ方を理解し、設計の意図を読み取れる',
    1.5, null, ''),
  sk('academia', academiaCatMap['QA実務'], 14, 'QA実務',
    'エビデンス取得(指導下)',
    '指示に沿ってスクリーンショット・ログ等のエビデンスを取得できる',
    1.0, null, ''),
  sk('academia', academiaCatMap['QA実務'], 15, 'QA実務',
    '不具合の検知と報告(初歩)',
    '想定と異なる挙動に気づき、再現手順を添えて報告できる',
    1.5, null, ''),

  // ── 案件経験 (4) ──
  sk('academia', academiaCatMap['案件経験'], 16, '案件経験',
    'チケット・タスク管理(初歩)',
    'Jira等のチケット・タスク管理ツールで、自分の担当作業の状況を確認・更新できる',
    0.5, null, ''),
  sk('academia', academiaCatMap['案件経験'], 17, '案件経験',
    '案件での報連相',
    '案件先で進捗・つまずきを適切なタイミングで報告・相談できる',
    1.0, null, ''),
  sk('academia', academiaCatMap['案件経験'], 18, '案件経験',
    'チームでの遂行',
    '割り当てられた作業を期限を意識してチームの一員として遂行できる',
    1.0, null, ''),
  sk('academia', academiaCatMap['案件経験'], 19, '案件経験',
    'IT知識の実地獲得',
    '案件を通じて対象システム・業務ドメインの知識を増やしている',
    1.0, null, ''),

  // ── ゴール (2) ──
  sk('academia', academiaCatMap['ゴール'], 20, 'ゴール',
    'JSTQB FL 受験準備',
    'シラバス全6章を学習し、模擬試験で合格水準(65%目安)に達している',
    2.0, null, '全章'),
  sk('academia', academiaCatMap['ゴール'], 21, 'ゴール',
    'JSTQB FL 合格',
    'JSTQB Foundation Level に合格する（＝Entry昇格の要件）',
    2.0, null, '全章'),

  // ══════════════════════════════════════
  // テスト自動化トラック — 35 skills (IDs 22–56)
  // ══════════════════════════════════════

  // ── Entry (5) ──
  sk('automation', autoLevelMap['Entry'], 1, 'IT基礎',
    'PC/IT基本操作',
    '拡張子・ディレクトリ構造・CLI操作を理解して操作ができる',
    2.0, 3, null),
  sk('automation', autoLevelMap['Entry'], 2, 'IT基礎',
    '学習姿勢',
    'IT用語を調べながら理解し業務に活用することができる',
    1.5, 2, null),
  sk('automation', autoLevelMap['Entry'], 3, 'テスト実行',
    'テスト実施',
    'テスト仕様書に従って操作し合否判定を行うことができる',
    1.0, 1, null),
  sk('automation', autoLevelMap['Entry'], 4, 'テスト実行',
    'バグ報告',
    '再現手順・期待値・実測値を整理して報告することができる',
    3.0, 5, null),
  sk('automation', autoLevelMap['Entry'], 5, 'テスト実行',
    '開発者ツールの初歩',
    'DevToolsを用いてエラーの有無を確認することができる',
    2.5, 4, null),

  // ── Associate (8) ──
  sk('automation', autoLevelMap['Associate'], 6, '自動化ツール',
    'ノーコードツール活用',
    'ツールを使って操作を記録し自動テストを作成することができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Associate'], 7, 'Playwright',
    '環境構築・基本操作',
    '環境構築を行いテストの実行とコード生成を行うことができる',
    1.2, null, null),
  sk('automation', autoLevelMap['Associate'], 8, 'Playwright',
    'ロケーター選定',
    '適切なセレクターを選定し安定したテストを作成することができる',
    2.0, null, null),
  sk('automation', autoLevelMap['Associate'], 9, 'Playwright',
    'アサーション',
    '非同期処理に対応した検証を実装することができる',
    1.8, null, null),
  sk('automation', autoLevelMap['Associate'], 10, 'Git',
    '基本操作',
    'ブランチ運用やPR作成およびコンフリクト解消を行うことができる',
    1.5, null, null),
  sk('automation', autoLevelMap['Associate'], 11, 'スクリプト',
    'ツール',
    'SQL等を用いたテストデータの構築ができる',
    1.0, null, null),
  sk('automation', autoLevelMap['Associate'], 12, 'Cursor',
    '基本操作',
    'AIを活用してコードの生成や修正を行うことができる',
    0.8, null, null),
  sk('automation', autoLevelMap['Associate'], 13, 'Cursor',
    'Context指定',
    'コンテキストを指定して精度の高いコード生成を行うことができる',
    1.2, null, null),

  // ── Professional (17) ──
  sk('automation', autoLevelMap['Professional'], 14, 'Playwright',
    '並列化・分離',
    '並列実行や状態管理を活用して効率的にテストを実行することができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 15, 'Playwright',
    'API Testing',
    'APIを利用してデータの検証や前処理を行うことができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 16, 'Playwright',
    'テスト設計(POM)',
    'Page Object Modelを用いて保守性の高いテスト設計を行うことができる',
    1.0, null, null),
  sk('automation', autoLevelMap['Professional'], 17, 'Playwright',
    '安定化',
    'テストの不安定要因を特定し改善することができる',
    1.0, null, null),
  sk('automation', autoLevelMap['Professional'], 18, 'Playwright',
    '戦略・運用',
    '自動化対象を判断し効率的な運用を行うことができる',
    1.0, null, null),
  sk('automation', autoLevelMap['Professional'], 19, 'Git',
    'CI/CD',
    'GitHub Actionsを用いてテスト自動実行を設定することができる',
    1.0, null, null),
  sk('automation', autoLevelMap['Professional'], 20, 'Git',
    'Artifacts',
    'テスト結果の成果物を保存し確認することができる',
    0.3, null, null),
  sk('automation', autoLevelMap['Professional'], 21, 'Git',
    'レビュー',
    'コードレビューを通して品質を向上させることができる',
    0.3, null, null),
  sk('automation', autoLevelMap['Professional'], 22, 'Cursor',
    'Composer',
    '複数ファイルにまたがる修正をAIで行うことができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 23, 'Cursor',
    'デバッグ',
    'AIを活用してエラー原因の特定と修正を行うことができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 24, 'Cursor',
    '品質判断',
    'AI生成コードの妥当性を判断し修正することができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 25, 'スクリプト',
    'プログラミング基礎',
    '条件分岐やループを用いた処理を実装することができる',
    0.3, null, null),
  sk('automation', autoLevelMap['Professional'], 26, 'スクリプト',
    'APIテスト',
    'APIツールを用いてデータのやり取りを検証することができる',
    0.3, null, null),
  sk('automation', autoLevelMap['Professional'], 27, 'スクリプト',
    'エラー分析',
    'コードを読み解きエラー原因を特定することができる',
    0.3, null, null),
  sk('automation', autoLevelMap['Professional'], 28, 'スクリプト',
    'DB操作',
    'SQLを用いてデータの取得や登録を行うことができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 29, '自動化設計',
    'CI/CD理解',
    'CI/CDパイプラインへのテスト統合の理解ができる',
    0.5, null, null),
  sk('automation', autoLevelMap['Professional'], 30, '自動化設計',
    'ROI導入',
    '自動化フレームワークの選定とROI算出ができる',
    1.0, null, null),

  // ── Expert (5) ──
  sk('automation', autoLevelMap['Expert'], 31, 'Playwright',
    'カスタムレポーター',
    'レポートや通知の仕組みをカスタマイズすることができる',
    1.0, null, null),
  sk('automation', autoLevelMap['Expert'], 32, '自動化設計',
    'ツール選定',
    'プロジェクトに適したツールを選定することができる',
    2.0, null, null),
  sk('automation', autoLevelMap['Expert'], 33, '自動化設計',
    '保守性設計',
    '変更に強い構造でテストを設計することができる',
    3.0, null, null),
  sk('automation', autoLevelMap['Expert'], 34, '自動化設計',
    'CI/CD導入',
    'CI/CD環境を構築しテスト自動化を実現することができる',
    1.5, null, null),
  sk('automation', autoLevelMap['Expert'], 35, '自動化設計',
    'ROI判断',
    '自動化の費用対効果を評価し最適化することができる',
    2.5, null, null),
];

// ── Teams ──
export const teams: Team[] = [
  { id: 1, name: 'QAチームA' },
  { id: 2, name: 'QAチームB' },
  { id: 3, name: '開発チーム' },
];

// ── Profiles ──
export const profiles: Profile[] = [
  { id: 'u1', display_name: '田中太郎', email: 'tanaka@widsley.com', role: 'member', team_id: 1, current_stage: 'Associate' },
  { id: 'u2', display_name: '佐藤花子', email: 'sato@widsley.com', role: 'member', team_id: 1, current_stage: 'Entry' },
  { id: 'u3', display_name: '鈴木一郎', email: 'suzuki@widsley.com', role: 'leader', team_id: 1, current_stage: 'Professional' },
  { id: 'u4', display_name: '高橋美咲', email: 'takahashi@widsley.com', role: 'member', team_id: 2, current_stage: null },
  { id: 'u5', display_name: '伊藤健太', email: 'ito@widsley.com', role: 'leader', team_id: 2, current_stage: 'Entry' },
  { id: 'u6', display_name: '渡辺裕子', email: 'watanabe@widsley.com', role: 'board', team_id: 3, current_stage: null },
];

// ── Assessments ──
export const assessments: Assessment[] = [
  // 田中 — both courses submitted
  { id: 1, user_id: 'u1', course_id: 'academia', status: 'submitted', submitted_at: '2026-06-10T09:00:00Z', created_at: '2026-06-01T08:00:00Z' },
  { id: 2, user_id: 'u1', course_id: 'automation', status: 'submitted', submitted_at: '2026-06-12T10:30:00Z', created_at: '2026-06-02T08:00:00Z' },
  // 佐藤 — academia submitted, automation draft
  { id: 3, user_id: 'u2', course_id: 'academia', status: 'submitted', submitted_at: '2026-06-11T14:00:00Z', created_at: '2026-06-03T08:00:00Z' },
  { id: 4, user_id: 'u2', course_id: 'automation', status: 'draft', submitted_at: null, created_at: '2026-06-05T08:00:00Z' },
  // 鈴木 — both courses submitted
  { id: 5, user_id: 'u3', course_id: 'academia', status: 'submitted', submitted_at: '2026-06-09T11:00:00Z', created_at: '2026-06-01T08:00:00Z' },
  { id: 6, user_id: 'u3', course_id: 'automation', status: 'submitted', submitted_at: '2026-06-13T16:00:00Z', created_at: '2026-06-02T08:00:00Z' },
];

// ── Answers ──
// Skill IDs: Academia 1–21, テスト自動化 22–56

let globalAnswerId = 0;
function buildAnswers(assessmentId: number, scoreMap: Record<number, number>): Answer[] {
  return Object.entries(scoreMap).map(([sid, score]) => ({
    id: ++globalAnswerId,
    assessment_id: assessmentId,
    skill_id: Number(sid),
    score,
  }));
}

// 田中 (u1) — Academia: strong in basics, moderate in advanced
const tanaka_academia: Record<number, number> = {
  1: 5, 2: 4, 3: 5, 4: 4,                         // 土台
  5: 4, 6: 3, 7: 3, 8: 4, 9: 4, 10: 3, 11: 3,     // QA知識
  12: 3, 13: 3, 14: 4, 15: 3,                       // QA実務
  16: 4, 17: 4, 18: 3, 19: 4,                       // 案件経験
  20: 2, 21: 3,                                      // ゴール
};

// 田中 (u1) — テスト自動化: Entry passed, Associate partial
const tanaka_auto: Record<number, number> = {
  22: 4, 23: 5, 24: 4, 25: 4, 26: 3,               // Entry
  27: 3, 28: 3, 29: 2, 30: 3, 31: 2, 32: 3, 33: 2, 34: 2, // Associate
  35: 2, 36: 1, 37: 1, 38: 1, 39: 2, 40: 1, 41: 1, 42: 1, 43: 1, 44: 1, 45: 1, 46: 1, 47: 1, 48: 1, 49: 1, 50: 1, 51: 1, // Professional
  52: 1, 53: 1, 54: 1, 55: 1, 56: 1,               // Expert
};

// 佐藤 (u2) — Academia: beginner level
const sato_academia: Record<number, number> = {
  1: 4, 2: 3, 3: 4, 4: 3,                          // 土台
  5: 3, 6: 2, 7: 2, 8: 3, 9: 3, 10: 1, 11: 2,     // QA知識
  12: 2, 13: 2, 14: 2, 15: 2,                       // QA実務
  16: 2, 17: 3, 18: 2, 19: 3,                       // 案件経験
  20: 1, 21: 1,                                      // ゴール
};

// 佐藤 (u2) — テスト自動化: partial Entry only (draft)
const sato_auto: Record<number, number> = {
  22: 2, 23: 3, 24: 2, 25: 2, 26: 1,               // Entry
};

// 鈴木 (u3) — Academia: senior level, high scores
const suzuki_academia: Record<number, number> = {
  1: 5, 2: 5, 3: 5, 4: 5,                          // 土台
  5: 5, 6: 4, 7: 5, 8: 5, 9: 5, 10: 4, 11: 4,     // QA知識
  12: 5, 13: 4, 14: 5, 15: 4,                       // QA実務
  16: 5, 17: 5, 18: 4, 19: 5,                       // 案件経験
  20: 5, 21: 5,                                      // ゴール
};

// 鈴木 (u3) — テスト自動化: Professional level
const suzuki_auto: Record<number, number> = {
  22: 5, 23: 5, 24: 5, 25: 5, 26: 5,               // Entry
  27: 5, 28: 4, 29: 4, 30: 4, 31: 4, 32: 4, 33: 4, 34: 3, // Associate
  35: 4, 36: 3, 37: 3, 38: 3, 39: 4, 40: 3, 41: 3, 42: 4, 43: 3, 44: 3, 45: 2, 46: 3, 47: 2, 48: 4, 49: 3, 50: 3, 51: 3, // Professional
  52: 2, 53: 2, 54: 2, 55: 1, 56: 2,               // Expert
};

export const answers: Answer[] = [
  ...buildAnswers(1, tanaka_academia),
  ...buildAnswers(2, tanaka_auto),
  ...buildAnswers(3, sato_academia),
  ...buildAnswers(4, sato_auto),
  ...buildAnswers(5, suzuki_academia),
  ...buildAnswers(6, suzuki_auto),
];
