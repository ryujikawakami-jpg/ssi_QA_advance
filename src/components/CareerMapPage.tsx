import { useState, useEffect, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCertifications,
  fetchUserCertifications,
  upsertUserCertification,
} from '../lib/data';
import type { CertificationRecord, UserCertification } from '../lib/data';

// ── Brand colors ──
const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';

// ── Types ──
type StageKey = 'ACADEMIA' | 'ENTRY' | 'ASSOCIATE' | 'PROFESSIONAL' | 'EXPERT';

interface CellData {
  title: string;
  role: string;
  skills: string[];
  certs?: string[];
}

interface TrackDef {
  name: string;
  cells: Partial<Record<StageKey, CellData>>;
}

interface TrackGroupDef {
  id: string;
  name: string;
  color: string;
  tracks: TrackDef[];
}

interface ScopeData {
  groupId: string;
  trackIdx: number;
  trackName: string;
}

// ── Stage labels ──
const STAGE_KEYS: StageKey[] = ['ACADEMIA', 'ENTRY', 'ASSOCIATE', 'PROFESSIONAL', 'EXPERT'];
const STAGE_LABELS: Record<StageKey, string> = {
  ACADEMIA: 'ACADEMIA',
  ENTRY: 'ENTRY',
  ASSOCIATE: 'ASSOCIATE',
  PROFESSIONAL: 'PROFESSIONAL',
  EXPERT: 'EXPERT',
};

// ── Common ACADEMIA cell ──
const ACADEMIA_CELL: CellData = {
  title: 'QA基礎',
  role: 'ITキャリアスタート。研修でQAエンジニアの基礎を学び、案件を通してIT知識と経験を増やす',
  skills: ['社会人基礎力', 'QA基礎知識', 'テスト技法理解', 'テスト実施（指導下）'],
  certs: ['JSTQB Foundation Level'],
};

// ── Track group data ──
const TRACK_GROUPS: TrackGroupDef[] = [
  {
    id: 'qa',
    name: 'QAエンジニア',
    color: '#7B2FB0',
    tracks: [
      {
        name: 'マネジメント',
        cells: {
          ENTRY: {
            title: '実行者',
            role: 'テスト仕様書に基づき、バグを確実に発見・報告すること',
            skills: ['テスト技法の基礎', 'Jira等バグ管理ツールの操作', '不具合起票'],
            certs: ['IVEC アシスタントクラス'],
          },
          ASSOCIATE: {
            title: '設計者',
            role: '仕様書を読み解き、抜け漏れのないテストケースを設計すること',
            skills: ['高度なテスト設計技法', '基本的な自動化ツールの運用', '開発者との円滑なコミュニケーション'],
            certs: ['JSTQB Advanced Level テストアナリスト', 'JCSQE 初級', 'IVEC テスタークラス'],
          },
          PROFESSIONAL: {
            title: '推進者',
            role: '効率的なテスト計画と、リスクに基づいた優先順位付け',
            skills: ['テスト戦略の策定', '自動化フレームワークの構築', '不具合分析によるプロセス改善提案'],
            certs: ['JSTQB Advanced Level テストマネージャ', 'JCSQE 中級', 'IVEC デザイナークラス'],
          },
          EXPERT: {
            title: 'マネージャー',
            role: 'QAチームの採用・育成、予算管理、組織全体の品質指標の定義化',
            skills: ['プロダクト経営視点', '品質保証コスト（CoQ）の最適化'],
            certs: ['JCSQE 上級', 'IVEC アーキテクトクラス', '認定スクラムマスター'],
          },
        },
      },
      {
        name: 'テスト自動化',
        cells: {
          ENTRY: {
            title: '実行者',
            role: 'テスト仕様書に基づき、バグを確実に発見・報告すること',
            skills: ['テスト技法の基礎', 'Jira等バグ管理ツールの操作', '不具合起票'],
            certs: ['ITパスポート試験', 'IVEC アシスタントクラス'],
          },
          ASSOCIATE: {
            title: '自動化ユーザー',
            role: 'ノーコードツールや録画機能でテストを作成できる。HTML構造を理解し要素を特定できる',
            skills: ['Autify/mabl/Selenium IDE', 'HTML/CSS', 'SQL基礎'],
            certs: ['Pythonエンジニア認定基礎試験', 'Oracle Certified Java Programmer, Silver SE 11'],
          },
          PROFESSIONAL: {
            title: '自動化エンジニア',
            role: 'コードを書いてテストを自動化できる。APIテストやCI/CDへの組み込みができる',
            skills: ['Python/Playwright', 'GitHub', 'CI/CDツール', 'API(Postman)'],
            certs: ['AWS Certified Cloud Practitioner', 'JSTQB Specialist テスト自動化エンジニア', 'GitHub Foundations'],
          },
          EXPERT: {
            title: 'QAアーキテクト',
            role: '組織全体の自動化戦略を立てる。保守性の高いフレームワークを設計し、ROIを管理する',
            skills: ['アーキテクチャ設計', 'Docker', '負荷テスト', 'チームマネジメント'],
            certs: ['AWS Certified Solutions Architect - Professional', 'JSTQB Advanced Level テストマネージャ', 'ISACA CISA'],
          },
        },
      },
      {
        name: 'セキュリティ',
        cells: {
          ASSOCIATE: {
            title: '侵害分析',
            role: '代表的な脆弱性を理解し、脆弱性の再現確認やリスク説明ができる',
            skills: ['OWASP基礎', '認証/認可の基本', '情報漏えい対策', '脆弱性再現', '基本対策の説明'],
            certs: ['Certified in Cybersecurity (CC)', 'CompTIA Security+'],
          },
          PROFESSIONAL: {
            title: '防御設計支援',
            role: 'セキュリティ観点でテスト設計・診断・優先度判断を行い、設計改善や対策提案を支援できる',
            skills: ['攻撃シナリオ設計', '脆弱性連鎖分析', '認証設計レビュー', '被害影響分析', 'リスク評価'],
            certs: ['徳丸基礎試験', 'SecuriST 脆弱性診断士', 'Systems Security Certified Practitioner (SSCP)', 'CEH'],
          },
          EXPERT: {
            title: 'セキュリティレビュー・リード',
            role: '仕様・設計レビューを通じて問題を指摘し、教育・改善活動を通じて組織へ影響を与えられる',
            skills: ['セキュア構成レビュー', 'アクセス制御設計', 'データ保護設計', 'セキュリティ教育設計', '組織改善推進'],
            certs: ['情報処理安全確保支援士試験', 'Certified Information Systems Security Professional (CISSP)', 'OSCP'],
          },
        },
      },
    ],
  },
  {
    id: 'app',
    name: 'アプリケーションエンジニア',
    color: '#0E5A8A',
    tracks: [
      {
        name: 'ソフトウェアエンジニア',
        cells: {
          ENTRY: {
            title: 'プログラマー',
            role: 'プログラミング基礎を習得し、詳細設計に基づくコーディングを行う',
            skills: ['プログラミング基礎', '詳細設計', 'バージョン管理', 'AIツール補完活用'],
            certs: ['ITパスポート試験', 'Javaプログラミング能力認定試験 3級', 'Oracle Master Bronze', 'Pythonエンジニア認定基礎試験'],
          },
          ASSOCIATE: {
            title: 'ジュニアエンジニア',
            role: '基本設計・DB設計・API設計を行い、非機能要件を把握できる',
            skills: ['基本設計', 'DB設計', 'API設計', '非機能要件の把握', 'クラウド基礎'],
            certs: ['基本情報技術者試験', 'Oracle Certified Java Programmer, Silver SE 11', 'AWS Certified Cloud Practitioner', 'AWS Certified AI Practitioner'],
          },
          PROFESSIONAL: {
            title: 'シニアエンジニア',
            role: '要件定義・顧客折衝・見積もり・プロジェクト技術リードを行う',
            skills: ['要件定義', '顧客折衝', '見積もり', 'パフォーマンス設計', 'LLM API組み込み'],
            certs: ['応用情報技術者試験', 'Oracle Certified Java Programmer, Gold SE 11', 'AWS Certified Solutions Architect - Associate', 'G検定'],
          },
          EXPERT: {
            title: 'システムコンサルタント',
            role: 'ドメイン知識を深化し、業務コンサルティング・提案・PoC主導を行う',
            skills: ['ドメイン知識の深化', '業務コンサルティング', '提案・PoC主導', 'RAG/エージェント構築'],
            certs: ['システムアーキテクト試験', 'ITストラテジスト試験', 'AWS Certified Solutions Architect - Professional', 'AWS Certified Machine Learning - Specialty'],
          },
        },
      },
      {
        name: 'アーキテクチャ',
        cells: {
          PROFESSIONAL: {
            title: 'テックリード',
            role: 'アーキテクチャ設計・技術選定・チームの技術指導を行う',
            skills: ['アーキテクチャ設計', '技術選定', 'チームの技術指導', 'パフォーマンス設計'],
            certs: ['応用情報技術者試験', 'AWS Certified Solutions Architect - Professional', 'Microsoft Certified: Azure Solutions Architect Expert'],
          },
          EXPERT: {
            title: 'チーフアーキテクト',
            role: '全社技術戦略・大規模システム設計・技術組織のリードを行う',
            skills: ['全社技術戦略', '大規模システム設計', '技術組織のリード'],
            certs: ['システムアーキテクト試験', 'Certified Kubernetes Administrator (CKA)', 'AWS Certified Solutions Architect - Professional'],
          },
        },
      },
    ],
  },
  {
    id: 'infra',
    name: 'クラウドインフラエンジニア',
    color: '#2E6B2E',
    tracks: [
      {
        name: 'クラウドインフラ',
        cells: {
          ENTRY: {
            title: 'インフラオペレーター',
            role: 'サーバ基本設定・運用、NW基本設定・疎通確認を行う',
            skills: ['サーバ基本設定・運用', 'NW基本設定', 'EC2・VPC基礎', '監視ツール運用'],
            certs: ['ITパスポート試験', 'AWS Certified Cloud Practitioner', 'LPIC-1', 'Microsoft Certified: Azure Fundamentals'],
          },
          ASSOCIATE: {
            title: 'インフラエンジニア',
            role: 'サーバ・NW設計書作成、可用性設計、IaC基礎を行う',
            skills: ['サーバ・NW設計書作成', '可用性設計', 'IaC基礎', 'クラウド構成設計'],
            certs: ['基本情報技術者試験', 'AWS Certified Solutions Architect - Associate', 'CCNA', 'LPIC-2'],
          },
          PROFESSIONAL: {
            title: 'シニアインフラエンジニア',
            role: '会社全体のサーバ・NW構成統括・設計・管理を行う',
            skills: ['インフラ最適化検討', 'コスト管理', 'セキュリティ設計', 'インフラ構築自動化'],
            certs: ['応用情報技術者試験', 'AWS Certified DevOps Engineer - Professional', 'CCNP', 'LPIC-3'],
          },
          EXPERT: {
            title: 'インフラアーキテクト',
            role: '大規模・複雑環境の統括・設計（マルチクラウド・グローバル対応等）',
            skills: ['インフラ最適化推進', '組織・チームリード', 'AIワークロードのインフラ設計'],
            certs: ['ITサービスマネージャ試験', 'ネットワークスペシャリスト試験', 'AWS Certified Solutions Architect - Professional', 'Certified Kubernetes Administrator (CKA)'],
          },
        },
      },
      {
        name: 'セキュリティ',
        cells: {
          PROFESSIONAL: {
            title: 'セキュリティエンジニア',
            role: '防御設計・アクセス制御・インシデント対応・セキュリティポリシー運用',
            skills: ['防御設計', 'アクセス制御', 'インシデント対応', 'セキュリティポリシー運用'],
            certs: ['応用情報技術者試験', 'AWS Certified Security - Specialty', 'Certified Cloud Security Professional (CCSP)', 'CompTIA Security+'],
          },
          EXPERT: {
            title: 'セキュリティアーキテクト',
            role: 'SOC運用統括・サイバー攻撃対策・セキュリティガバナンス',
            skills: ['SOC運用統括', 'サイバー攻撃対策', 'セキュリティガバナンス'],
            certs: ['情報処理安全確保支援士試験', 'Certified Information Systems Security Professional (CISSP)', 'AWS Certified Security - Specialty'],
          },
        },
      },
    ],
  },
  {
    id: 'pm',
    name: 'PM',
    color: '#8A6D1A',
    tracks: [
      {
        name: 'PM',
        cells: {
          ASSOCIATE: {
            title: 'PMO',
            role: '進捗・課題管理、ドキュメント整備、会議運営の補佐',
            skills: ['進捗・課題管理', 'ドキュメント整備', '会議運営の補佐'],
            certs: ['ITパスポート試験', '基本情報技術者試験', '認定スクラムマスター(CSM)'],
          },
          PROFESSIONAL: {
            title: 'PL',
            role: 'QA・ソフトウェア・インフラなど領域ごとのリーダーが該当',
            skills: ['チームリード', '領域別プロジェクト管理'],
          },
          EXPERT: {
            title: 'PM',
            role: 'プロジェクト全体責任、予算・リスク管理、ステークホルダー調整',
            skills: ['プロジェクト全体責任', '予算・リスク管理', 'ステークホルダー調整'],
            certs: ['プロジェクトマネージャ試験', 'PMP\u00AE (Project Management Professional)', 'ITサービスマネージャ試験'],
          },
        },
      },
    ],
  },
  {
    id: 'biz',
    name: 'ビジネス・推進',
    color: '#B5481F',
    tracks: [
      {
        name: 'バックオフィス・DX推進',
        cells: {
          ENTRY: {
            title: 'IT管理担当',
            role: 'IT機器キッティング・管理、アカウント管理、担当業務理解',
            skills: ['IT機器キッティング・管理', 'アカウント管理', '担当業務理解'],
            certs: ['ITパスポート試験'],
          },
          ASSOCIATE: {
            title: 'IT運用・改善担当',
            role: 'ヘルプデスク対応、社内システム運用、ベンダー管理',
            skills: ['ヘルプデスク対応', '社内システム運用', 'ベンダー管理', 'RPA構築'],
            certs: ['情報セキュリティマネジメント試験', 'RPA技術者検定'],
          },
          PROFESSIONAL: {
            title: 'ITアドミン・DX推進',
            role: '社内IT環境の設計・改善、セキュリティポリシー運用',
            skills: ['社内IT環境の設計・改善', 'セキュリティポリシー運用', 'RPA・自動化推進'],
            certs: ['基本情報技術者試験', 'AWS Certified Cloud Practitioner', 'ITコーディネータ'],
          },
          EXPERT: {
            title: 'IT戦略・DX企画',
            role: 'IT投資計画、全社DX推進・システム刷新、情報セキュリティ戦略',
            skills: ['IT投資計画', '全社DX推進', '情報セキュリティ戦略'],
            certs: ['応用情報技術者試験', 'ITストラテジスト試験', 'PMP\u00AE (Project Management Professional)'],
          },
        },
      },
      {
        name: 'カスタマーサポート',
        cells: {
          ENTRY: {
            title: 'CS担当者',
            role: '問い合わせ対応、一次切り分け、FAQ整備',
            skills: ['問い合わせ対応', '一次切り分け', 'FAQ整備'],
            certs: ['ITパスポート試験'],
          },
          ASSOCIATE: {
            title: 'CSアナリスト',
            role: '問い合わせ傾向の分析、FAQ高度化、対応品質の改善提案',
            skills: ['問い合わせ傾向の分析', 'FAQ高度化', '対応品質の改善提案'],
            certs: ['情報セキュリティマネジメント試験', 'HDI-CSCA'],
          },
          PROFESSIONAL: {
            title: 'CSスペシャリスト',
            role: '関係部門との連携、不具合エスカレーション、技術的な問題解決',
            skills: ['関係部門との連携', '不具合エスカレーション', '技術的な問題解決'],
            certs: ['基本情報技術者試験', 'HDI-CSCTL'],
          },
          EXPERT: {
            title: 'CS企画・推進',
            role: 'CS組織の設計、KPI策定、プロダクト改善への提言',
            skills: ['CS組織の設計', 'KPI策定', 'プロダクト改善への提言'],
            certs: ['応用情報技術者試験', 'ITサービスマネージャ試験'],
          },
        },
      },
      {
        name: 'データアナリスト',
        cells: {
          ENTRY: {
            title: 'データオペレーター',
            role: 'SQL・BIツール基礎、データ抽出・集計、レポート作成',
            skills: ['SQL・BIツール基礎', 'データ抽出・集計', 'レポート作成'],
            certs: ['ITパスポート試験', 'Pythonエンジニア認定基礎試験', 'AWS Certified AI Practitioner'],
          },
          ASSOCIATE: {
            title: 'データアナリスト',
            role: '分析手法・統計学を用い、仮説立案・可視化・課題発見',
            skills: ['分析手法・統計学', 'DWH理解', '仮説立案・可視化', '課題発見'],
            certs: ['基本情報技術者試験', 'AWS Certified Data Engineer - Associate', '統計検定2級'],
          },
          PROFESSIONAL: {
            title: 'データコンサルタント',
            role: '改善提案・施策立案、クライアントへのプレゼン',
            skills: ['改善提案・施策立案', 'クライアントプレゼン', 'Python・機械学習基礎'],
            certs: ['応用情報技術者試験', 'AWS Certified Machine Learning - Specialty', '統計検定1級'],
          },
          EXPERT: {
            title: 'データストラテジスト',
            role: 'クライアントのデータ戦略立案、データ基盤設計、データ活用推進',
            skills: ['データ戦略立案', 'データ基盤設計', 'データ活用推進'],
            certs: ['データベーススペシャリスト試験', 'AWS Certified Machine Learning - Specialty', 'G検定・E資格'],
          },
        },
      },
      {
        name: 'マーケティング',
        cells: {
          ENTRY: {
            title: 'コンテンツ担当',
            role: 'コンテンツ制作、SEO基礎、Web・SNS運用',
            skills: ['コンテンツ制作', 'SEO基礎', 'Web・SNS運用'],
            certs: ['ITパスポート試験', 'ウェブ解析士'],
          },
          ASSOCIATE: {
            title: 'マーケター',
            role: 'Web・SNS広告運用、効果測定・分析、PDCAサイクル',
            skills: ['広告運用', '効果測定・分析', 'PDCAサイクル'],
            certs: ['ウェブ解析士マスター', 'GAIQ', 'Google 広告認定'],
          },
          PROFESSIONAL: {
            title: 'マーケティングプランナー',
            role: '施策企画・立案、マルチチャネル戦略、データに基づく改善提案',
            skills: ['施策企画・立案', 'マルチチャネル戦略', 'データに基づく改善'],
            certs: ['GAIQ', 'HubSpot認定', 'Pythonエンジニア認定基礎試験'],
          },
          EXPERT: {
            title: 'マーケティングストラテジスト',
            role: 'マーケ戦略立案、ブランディング、クライアントの市場戦略推進',
            skills: ['マーケ戦略立案', 'ブランディング', '市場戦略推進'],
            certs: ['応用情報技術者試験', 'ITストラテジスト試験'],
          },
        },
      },
    ],
  },
];

// ── "まだ決まっていない方" data ──
interface UndecidedEntry {
  groupId: string;
  trackIdx: number;
  groupName: string;
  trackName: string;
  role: string;
  description: string;
}

const ENTRY_LEVEL_LIST: UndecidedEntry[] = [
  { groupId: 'qa', trackIdx: 0, groupName: 'QAエンジニア', trackName: 'マネジメント', role: '実行者', description: 'テスト仕様書に基づき、バグを確実に発見・報告' },
  { groupId: 'qa', trackIdx: 1, groupName: 'QAエンジニア', trackName: 'テスト自動化', role: '実行者', description: 'テスト仕様書に基づき、バグを確実に発見・報告' },
  { groupId: 'app', trackIdx: 0, groupName: 'アプリケーションエンジニア', trackName: 'ソフトウェアエンジニア', role: 'プログラマー', description: 'プログラミング基礎・バージョン管理' },
  { groupId: 'infra', trackIdx: 0, groupName: 'クラウドインフラエンジニア', trackName: 'クラウドインフラ', role: 'インフラオペレーター', description: 'サーバ基本設定・運用' },
];

const ASSOCIATE_LEVEL_LIST: UndecidedEntry[] = [
  ...ENTRY_LEVEL_LIST.map(e => {
    const group = TRACK_GROUPS.find(g => g.id === e.groupId);
    const track = group?.tracks[e.trackIdx];
    const assocCell = track?.cells.ASSOCIATE;
    return {
      ...e,
      role: assocCell?.title ?? e.role,
      description: assocCell?.role ?? e.description,
    };
  }),
  { groupId: 'qa', trackIdx: 2, groupName: 'QAエンジニア', trackName: 'セキュリティ', role: '侵害分析', description: '代表的な脆弱性を理解し、脆弱性の再現確認やリスク説明ができる' },
  { groupId: 'pm', trackIdx: 0, groupName: 'PM', trackName: 'PM', role: 'PMO', description: '進捗・課題管理、ドキュメント整備、会議運営の補佐' },
];

// ── Helpers ──

/** Fuzzy cert name matcher: exact first, then contains */
function findCertByName(allCerts: CertificationRecord[], name: string): CertificationRecord | undefined {
  const exact = allCerts.find(c => c.name === name);
  if (exact) return exact;
  // Check if DB cert name contains search name or vice versa
  const lower = name.toLowerCase();
  return allCerts.find(c => {
    const cLower = c.name.toLowerCase();
    return cLower.includes(lower) || lower.includes(cLower);
  });
}

/** Collect all certs from a route (ACADEMIA + track cells) */
function collectRouteCerts(track: TrackDef): { certName: string; level: StageKey }[] {
  const result: { certName: string; level: StageKey }[] = [];
  if (ACADEMIA_CELL.certs) {
    for (const c of ACADEMIA_CELL.certs) {
      result.push({ certName: c, level: 'ACADEMIA' });
    }
  }
  for (const stageKey of STAGE_KEYS) {
    if (stageKey === 'ACADEMIA') continue;
    const cell = track.cells[stageKey];
    if (cell?.certs) {
      for (const c of cell.certs) {
        result.push({ certName: c, level: stageKey });
      }
    }
  }
  return result;
}

function scopeKey(userId: string): string {
  return `career_scope_${userId}`;
}

function loadScope(userId: string): ScopeData | null {
  try {
    const raw = localStorage.getItem(scopeKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ScopeData;
  } catch {
    return null;
  }
}

function saveScope(userId: string, data: ScopeData): void {
  localStorage.setItem(scopeKey(userId), JSON.stringify(data));
}

function removeScope(userId: string): void {
  localStorage.removeItem(scopeKey(userId));
}

// ── Component ──
export default function CareerMapPage() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';

  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Section 1 state
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number | null>(null);

  // Section 2 modal
  const [modalStageKey, setModalStageKey] = useState<StageKey | null>(null);

  // Cert detail modal
  const [certDetailName, setCertDetailName] = useState<string | null>(null);

  // Scope
  const [scope, setScope] = useState<ScopeData | null>(null);

  // Certifications data
  const [allCerts, setAllCerts] = useState<CertificationRecord[]>([]);
  const [userCerts, setUserCerts] = useState<UserCertification[]>([]);

  // Undecided expandable sections
  const [showEntryList, setShowEntryList] = useState(false);
  const [showAssociateList, setShowAssociateList] = useState(false);

  // Load scope from localStorage
  useEffect(() => {
    const saved = loadScope(userId);
    if (saved) {
      setScope(saved);
      setSelectedGroupId(saved.groupId);
      setSelectedTrackIdx(saved.trackIdx);
      setExpandedGroupId(saved.groupId);
    }
  }, [userId]);

  // Fetch certifications
  const loadCerts = useCallback(async () => {
    try {
      const [certs, uCerts] = await Promise.all([
        fetchCertifications(),
        fetchUserCertifications(userId === 'anonymous' ? undefined : userId),
      ]);
      setAllCerts(certs);
      setUserCerts(uCerts);
    } catch {
      // silently fail
    }
  }, [userId]);

  useEffect(() => {
    loadCerts();
  }, [loadCerts]);

  // Derived state
  const selectedGroup = selectedGroupId
    ? TRACK_GROUPS.find(g => g.id === selectedGroupId) ?? null
    : null;
  const selectedTrack = selectedGroup && selectedTrackIdx !== null
    ? selectedGroup.tracks[selectedTrackIdx] ?? null
    : null;
  const isScoped = scope !== null
    && scope.groupId === selectedGroupId
    && scope.trackIdx === selectedTrackIdx;

  // Handlers
  const handleGroupClick = (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(groupId);
    }
    setSelectedGroupId(null);
    setSelectedTrackIdx(null);
  };

  const routeRef = useRef<HTMLDivElement>(null);

  const handleSubTrackClick = (groupId: string, trackIdx: number) => {
    setSelectedGroupId(groupId);
    setSelectedTrackIdx(trackIdx);
    setTimeout(() => {
      routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleScope = () => {
    if (!selectedGroup || selectedTrackIdx === null || !selectedTrack) return;
    const data: ScopeData = {
      groupId: selectedGroup.id,
      trackIdx: selectedTrackIdx,
      trackName: selectedTrack.name,
    };
    saveScope(userId, data);
    setScope(data);
  };

  const handleUnscope = () => {
    removeScope(userId);
    setScope(null);
  };

  const handleAddCert = async (certName: string) => {
    const certRecord = findCertByName(allCerts, certName);
    if (!certRecord || userId === 'anonymous') return;
    try {
      await upsertUserCertification(userId, certRecord.id, 'interested');
      await loadCerts();
    } catch {
      // silently fail
    }
  };

  const getUserCertStatus = useCallback((certName: string): UserCertification['status'] | null => {
    const certRecord = findCertByName(allCerts, certName);
    if (!certRecord) return null;
    const uc = userCerts.find(u => u.certification_id === certRecord.id);
    return uc?.status ?? null;
  }, [allCerts, userCerts]);

  // Cert detail data
  const certDetailRecord = certDetailName ? findCertByName(allCerts, certDetailName) : undefined;
  const certDetailStatus = certDetailName ? getUserCertStatus(certDetailName) : null;

  // Modal data
  const modalCell = modalStageKey
    ? (modalStageKey === 'ACADEMIA' ? ACADEMIA_CELL : selectedTrack?.cells[modalStageKey] ?? null)
    : null;

  const renderCertStatus = (certName: string, compact?: boolean) => {
    const status = getUserCertStatus(certName);
    const fontSize = compact ? 10 : 12;
    if (status === 'acquired') {
      return (
        <span style={{ ...s.certStatusBadge, background: '#e2e8f0', color: '#94a3b8', fontSize }}>
          取得済み
        </span>
      );
    }
    if (status === 'studying') {
      return (
        <span style={{ ...s.certStatusBadge, background: '#dbeafe', color: '#2563eb', fontSize }}>
          学習中
        </span>
      );
    }
    if (status === 'interested') {
      return (
        <span style={{ ...s.certStatusBadge, background: '#fce7f3', color: MAGENTA, fontSize }}>
          気になる
        </span>
      );
    }
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleAddCert(certName); }}
        style={{ ...s.addCertBtn, fontSize }}
      >
        + お気に入りに追加
      </button>
    );
  };

  const handleUndecidedCardClick = (entry: UndecidedEntry) => {
    // Select the track AND open the modal for the appropriate stage
    setExpandedGroupId(entry.groupId);
    setSelectedGroupId(entry.groupId);
    setSelectedTrackIdx(entry.trackIdx);

    // Determine which stage this entry belongs to
    const isEntry = ENTRY_LEVEL_LIST.some(e => e.groupId === entry.groupId && e.trackIdx === entry.trackIdx && e.role === entry.role);
    const stageKey: StageKey = isEntry ? 'ENTRY' : 'ASSOCIATE';

    // Open the detail modal directly
    setTimeout(() => setModalStageKey(stageKey), 50);
  };

  return (
    <div style={s.page}>
      {/* ── Section 1: Track Selection ── */}
      <div style={s.section1}>
        <h1 style={s.mainTitle}>キャリアパス</h1>
        <p style={s.mainSubtitle}>なりたい職種を選んで、キャリアルートを確認しましょう</p>
        <p style={s.mainNote}>
          まだ決まっていない方は、Entry/Associateで幅広くスキルを身につけることで、どの専門にも進めます
        </p>

        {/* Undecided expandable sections */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowEntryList(!showEntryList)}
            style={s.undecidedToggle}
          >
            <span>{showEntryList ? '\u25BC' : '\u25B6'}</span>
            <span style={{ marginLeft: 8 }}>Entry レベル（半年〜1年）の職種一覧</span>
          </button>
          {showEntryList && (
            <div style={s.undecidedGrid}>
              {ENTRY_LEVEL_LIST.map((entry, idx) => {
                const groupColor = TRACK_GROUPS.find(g => g.id === entry.groupId)?.color ?? '#ccc';
                return (
                  <button
                    key={idx}
                    onClick={() => handleUndecidedCardClick(entry)}
                    style={{
                      ...s.undecidedCard,
                      borderLeft: `4px solid ${groupColor}`,
                    }}
                  >
                    <div style={{ ...s.undecidedCardGroup, color: groupColor }}>
                      {entry.groupName} / {entry.trackName}
                    </div>
                    <div style={s.undecidedCardLabel}>{entry.role}</div>
                    <div style={s.undecidedCardRole}>{entry.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setShowAssociateList(!showAssociateList)}
            style={{ ...s.undecidedToggle, marginTop: 8 }}
          >
            <span>{showAssociateList ? '\u25BC' : '\u25B6'}</span>
            <span style={{ marginLeft: 8 }}>Associate レベル（1〜3年）の職種一覧</span>
          </button>
          {showAssociateList && (
            <div style={s.undecidedGrid}>
              {ASSOCIATE_LEVEL_LIST.map((entry, idx) => {
                const groupColor = TRACK_GROUPS.find(g => g.id === entry.groupId)?.color ?? '#ccc';
                return (
                  <button
                    key={idx}
                    onClick={() => handleUndecidedCardClick(entry)}
                    style={{
                      ...s.undecidedCard,
                      borderLeft: `4px solid ${groupColor}`,
                    }}
                  >
                    <div style={{ ...s.undecidedCardGroup, color: groupColor }}>
                      {entry.groupName} / {entry.trackName}
                    </div>
                    <div style={s.undecidedCardLabel}>{entry.role}</div>
                    <div style={s.undecidedCardRole}>{entry.description}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Track group grid */}
        <div style={s.groupGrid}>
          {TRACK_GROUPS.map(group => {
            const isExpanded = expandedGroupId === group.id;
            return (
              <div key={group.id} style={{ width: '100%' }}>
                <div
                  onClick={() => handleGroupClick(group.id)}
                  style={{
                    ...s.groupCard,
                    borderLeftColor: group.color,
                    boxShadow: isExpanded
                      ? `0 4px 16px ${group.color}30`
                      : '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ ...s.groupDot, background: group.color }} />
                  <div style={s.groupCardText}>
                    <div style={{ ...s.groupName, color: group.color }}>{group.name}</div>
                    <div style={s.groupTrackCount}>{group.tracks.length}トラック</div>
                  </div>
                  <div style={{ ...s.groupChevron, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    &#9654;
                  </div>
                </div>

                {/* Sub-tracks */}
                {isExpanded && (
                  <div style={s.subTrackList}>
                    {group.tracks.map((track, tIdx) => {
                      const isSelected = selectedGroupId === group.id && selectedTrackIdx === tIdx;
                      return (
                        <button
                          key={tIdx}
                          onClick={() => handleSubTrackClick(group.id, tIdx)}
                          style={{
                            ...s.subTrackBtn,
                            background: isSelected ? group.color : '#f8fafc',
                            color: isSelected ? '#fff' : DEEP_BLUE,
                            borderColor: isSelected ? group.color : '#e2e8f0',
                          }}
                        >
                          {track.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Route Display ── */}
      {selectedTrack && selectedGroup && (
        <div ref={routeRef} style={s.section2}>
          <h2 style={s.routeTitle}>
            {selectedGroup.name} / {selectedTrack.name} のキャリアルート
          </h2>

          <div style={{
            ...s.routeRow,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'stretch',
          }}>
            {(() => {
              const cells = STAGE_KEYS
                .map(sk => ({ stageKey: sk, cell: sk === 'ACADEMIA' ? ACADEMIA_CELL : selectedTrack.cells[sk] }))
                .filter(item => item.cell != null);
              const items: React.ReactNode[] = [];
              cells.forEach((item, idx) => {
                const { stageKey, cell } = item;
                if (!cell) return;
                if (idx > 0) {
                  items.push(
                    <div key={`arrow-${stageKey}`} style={{
                      flex: '0 0 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 18, color: selectedGroup.color, fontWeight: 700 }}>
                        {isMobile ? '\u25BC' : '\u2192'}
                      </span>
                    </div>
                  );
                }
                items.push(
                  <div
                    key={stageKey}
                    onClick={() => setModalStageKey(stageKey)}
                    style={{
                      ...s.routeCard,
                      borderTopColor: selectedGroup.color,
                      cursor: 'pointer',
                      flex: isMobile ? undefined : '1 1 0',
                      minWidth: 0,
                      width: isMobile ? '100%' : undefined,
                      maxWidth: isMobile ? 'none' : undefined,
                      padding: 16,
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ ...s.levelBadge, background: `${selectedGroup.color}18`, color: selectedGroup.color }}>
                      {STAGE_LABELS[stageKey]}
                    </span>
                    <div style={s.routeCardTitle}>{cell.title}</div>
                    <div style={s.routeCardRole}>
                      {cell.role.length > 50 ? cell.role.slice(0, 50) + '...' : cell.role}
                    </div>
                    <div style={{ ...s.routeCardHint, color: selectedGroup.color }}>
                      詳細を見る &rarr;
                    </div>
                  </div>
                );
              });
              return items;
            })()}
          </div>

          {/* Scope button */}
          <div style={s.scopeBtnRow}>
            {isScoped ? (
              <div style={s.scopedRow}>
                <span style={s.scopedBadge}>スコープ中</span>
                <button onClick={handleUnscope} style={s.unscopeBtn}>
                  スコープを解除
                </button>
              </div>
            ) : (
              <button onClick={handleScope} style={s.scopeBtn}>
                このキャリアパスをスコープする
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Section 3: Scope Summary ── */}
      {scope && (() => {
        const scopeGroup = TRACK_GROUPS.find(g => g.id === scope.groupId);
        const scopeTrack = scopeGroup?.tracks[scope.trackIdx];
        if (!scopeGroup || !scopeTrack) return null;
        const routeCerts = collectRouteCerts(scopeTrack);
        if (routeCerts.length === 0) return null;

        return (
          <div style={s.section3}>
            <h2 style={s.scopeSummaryTitle}>スコープ推奨資格・スキル一覧</h2>
            <p style={s.scopeSummarySubtitle}>
              {scopeGroup.name} / {scopeTrack.name}
            </p>
            <div style={s.certList}>
              {routeCerts.map((item, idx) => {
                const status = getUserCertStatus(item.certName);
                const isAcquired = status === 'acquired';
                return (
                  <div
                    key={idx}
                    onClick={() => setCertDetailName(item.certName)}
                    style={{
                      ...s.certListItem,
                      opacity: isAcquired ? 0.55 : 1,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={s.certListLeft}>
                      <span style={s.certName}>{item.certName}</span>
                      <span style={s.certLevel}>{STAGE_LABELS[item.level]}</span>
                    </div>
                    <div style={s.certListRight}>
                      {renderCertStatus(item.certName)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Route Card Modal ── */}
      {modalStageKey && modalCell && selectedGroup && (
        <div style={s.modalOverlay} onClick={() => setModalStageKey(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalStageKey(null)} style={s.modalClose}>
              &#10005;
            </button>

            <span style={{ ...s.modalLevelBadge, background: `${selectedGroup.color}18`, color: selectedGroup.color }}>
              {STAGE_LABELS[modalStageKey]}
            </span>
            <h2 style={s.modalTitle}>{modalCell.title}</h2>
            <p style={s.modalGroupLabel}>{selectedGroup.name}</p>

            <div style={s.modalSection}>
              <h3 style={s.modalSectionTitle}>期待される役割</h3>
              <p style={s.modalSectionBody}>{modalCell.role}</p>
            </div>

            <div style={s.modalSection}>
              <h3 style={s.modalSectionTitle}>必要スキル</h3>
              <div style={s.modalSkillTags}>
                {modalCell.skills.map((skill, i) => (
                  <span key={i} style={{ ...s.modalSkillTag, background: `${selectedGroup.color}12`, color: selectedGroup.color }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {modalCell.certs && modalCell.certs.length > 0 && (
              <div style={s.modalSection}>
                <h3 style={s.modalSectionTitle}>推奨資格</h3>
                <div style={s.modalCertList}>
                  {modalCell.certs.map((certName, i) => (
                    <div
                      key={i}
                      onClick={() => setCertDetailName(certName)}
                      style={{ ...s.modalCertRow, cursor: 'pointer' }}
                    >
                      <span style={s.modalCertName}>{certName}</span>
                      {renderCertStatus(certName, true)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cert Detail Modal ── */}
      {certDetailName && (
        <div style={s.certDetailOverlay} onClick={() => setCertDetailName(null)}>
          <div style={s.certDetailCard} onClick={e => e.stopPropagation()}>
            <button onClick={() => setCertDetailName(null)} style={s.modalClose}>
              &#10005;
            </button>

            <h2 style={s.certDetailTitle}>{certDetailName}</h2>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 12 }}>
              {certDetailRecord?.level && (
                <span style={s.certDetailBadge}>{certDetailRecord.level}</span>
              )}
              {certDetailRecord?.category && (
                <span style={{ ...s.certDetailBadge, background: '#dbeafe', color: '#2563eb' }}>
                  {certDetailRecord.category}
                </span>
              )}
            </div>

            <p style={s.certDetailDesc}>
              {certDetailRecord?.description || '説明はまだありません'}
            </p>

            <div style={{ marginTop: 16 }}>
              {certDetailStatus === 'acquired' ? (
                <span style={{ ...s.certStatusBadge, background: '#e2e8f0', color: '#94a3b8', fontSize: 14, padding: '6px 16px' }}>
                  取得済み
                </span>
              ) : certDetailStatus === 'studying' ? (
                <span style={{ ...s.certStatusBadge, background: '#dbeafe', color: '#2563eb', fontSize: 14, padding: '6px 16px' }}>
                  学習中
                </span>
              ) : certDetailStatus === 'interested' ? (
                <span style={{ ...s.certStatusBadge, background: '#fce7f3', color: MAGENTA, fontSize: 14, padding: '6px 16px' }}>
                  気になる登録済み
                </span>
              ) : (
                <button
                  onClick={() => handleAddCert(certDetailName)}
                  style={s.certDetailFavBtn}
                >
                  気になる
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──
const s: Record<string, CSSProperties> = {
  page: {
    margin: '0 auto',
    padding: '24px 16px 80px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 900,
  },

  // Section 1
  section1: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: '0 0 4px',
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#475569',
    margin: '0 0 8px',
  },
  mainNote: {
    fontSize: 13,
    color: '#64748b',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: 8,
    padding: '8px 12px',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },

  // Undecided sections
  undecidedToggle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: DEEP_BLUE,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
  },
  undecidedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 10,
    padding: '12px 0 4px 0',
  },
  undecidedCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: 4,
    padding: '10px 14px',
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left' as const,
  },
  undecidedCardGroup: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  undecidedCardLabel: {
    fontWeight: 700,
    color: DEEP_BLUE,
    fontSize: 14,
  },
  undecidedCardRole: {
    fontWeight: 500,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.4,
  },

  groupGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  groupCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    background: '#fff',
    borderRadius: 10,
    borderLeft: '5px solid',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  groupCardText: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: 700,
  },
  groupTrackCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  groupChevron: {
    fontSize: 12,
    color: '#94a3b8',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
  },
  subTrackList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    padding: '8px 0 0 22px',
  },
  subTrackBtn: {
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 16px',
    borderRadius: 20,
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: 'none',
  },

  // Section 2
  section2: {
    marginBottom: 32,
    padding: '20px',
    background: '#f8fafc',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: DEEP_BLUE,
    margin: '0 0 16px',
  },
  routeRow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 0,
    marginBottom: 20,
    overflowX: 'hidden' as const,
  },
  routeCard: {
    background: '#fff',
    borderRadius: 12,
    borderTop: '4px solid',
    padding: '12px 14px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  levelBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 8,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: DEEP_BLUE,
    lineHeight: 1.3,
  },
  routeCardRole: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.5,
    flex: 1,
  },
  routeCardHint: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 4,
  },

  // Scope button area
  scopeBtnRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  scopeBtn: {
    fontSize: 15,
    fontWeight: 700,
    padding: '12px 32px',
    borderRadius: 28,
    border: 'none',
    background: `linear-gradient(135deg, ${SEA_GREEN} 0%, ${CYAN} 100%)`,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(61,183,228,0.3)',
  },
  scopedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  scopedBadge: {
    fontSize: 13,
    fontWeight: 700,
    padding: '6px 16px',
    borderRadius: 20,
    background: `${SEA_GREEN}20`,
    color: '#0d9488',
  },
  unscopeBtn: {
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 16px',
    borderRadius: 20,
    border: '1.5px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    cursor: 'pointer',
  },

  // Section 3
  section3: {
    marginBottom: 32,
    padding: '20px',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  scopeSummaryTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: DEEP_BLUE,
    margin: '0 0 4px',
  },
  scopeSummarySubtitle: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 16px',
  },
  certList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  certListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#f8fafc',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
  },
  certListLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  certName: {
    fontSize: 14,
    fontWeight: 600,
    color: DEEP_BLUE,
  },
  certLevel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  certListRight: {
    flexShrink: 0,
  },

  // Cert status badges
  certStatusBadge: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12,
  },
  addCertBtn: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 12,
    border: `1.5px solid ${MAGENTA}`,
    background: '#fff',
    color: MAGENTA,
    cursor: 'pointer',
  },

  // Modal
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3,32,47,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modalCard: {
    position: 'relative' as const,
    background: '#fff',
    borderRadius: 16,
    padding: '28px 24px',
    maxWidth: 520,
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  modalClose: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: '#f1f5f9',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  modalLevelBadge: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: 10,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: '0 0 4px',
  },
  modalGroupLabel: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 20px',
  },
  modalSection: {
    marginBottom: 18,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#475569',
    margin: '0 0 8px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: 4,
  },
  modalSectionBody: {
    fontSize: 14,
    color: DEEP_BLUE,
    lineHeight: 1.7,
    margin: 0,
  },
  modalSkillTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  modalSkillTag: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 8,
  },
  modalCertList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  modalCertRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: '#f8fafc',
    borderRadius: 8,
  },
  modalCertName: {
    fontSize: 13,
    fontWeight: 600,
    color: DEEP_BLUE,
  },

  // Cert detail modal
  certDetailOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3,32,47,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 16,
  },
  certDetailCard: {
    position: 'relative' as const,
    background: '#fff',
    borderRadius: 16,
    padding: '28px 24px',
    maxWidth: 440,
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  certDetailTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: '0 0 10px',
    paddingRight: 36,
  },
  certDetailBadge: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
    background: '#f0fdf4',
    color: '#16a34a',
  },
  certDetailDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.7,
    margin: 0,
  },
  certDetailFavBtn: {
    fontSize: 15,
    fontWeight: 700,
    padding: '10px 28px',
    borderRadius: 24,
    border: 'none',
    background: MAGENTA,
    color: '#fff',
    cursor: 'pointer',
    boxShadow: `0 4px 14px ${MAGENTA}40`,
  },
};
