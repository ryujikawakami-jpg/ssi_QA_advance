import { useState } from 'react';
import type { CSSProperties } from 'react';

// ── Brand colors ──
const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';

// ── Stage definitions ──
type StageKey = 'ACADEMIA' | 'ENTRY' | 'ASSOCIATE' | 'PROFESSIONAL' | 'EXPERT';

interface Stage {
  key: StageKey;
  label: string;
  period: string;
}

const STAGES: Stage[] = [
  { key: 'ACADEMIA', label: 'ACADEMIA', period: '入社〜半年' },
  { key: 'ENTRY', label: 'ENTRY', period: '半年〜1年' },
  { key: 'ASSOCIATE', label: 'ASSOCIATE', period: '1〜3年' },
  { key: 'PROFESSIONAL', label: 'PROFESSIONAL', period: '3〜5年' },
  { key: 'EXPERT', label: 'EXPERT', period: '5年〜' },
];

// ── Cell data ──
interface CellData {
  title: string;
  skills: string;
  certs?: string;
}

type StageCells = Partial<Record<StageKey, CellData>>;

interface Track {
  name: string;
  cells: StageCells;
}

interface TrackGroup {
  id: string;
  name: string;
  color: string;
  tracks: Track[];
}

// ── Career data ──
const TRACK_GROUPS: TrackGroup[] = [
  {
    id: 'qa',
    name: 'QAエンジニア',
    color: '#7B2FB0',
    tracks: [
      {
        name: 'QAエンジニア',
        cells: {
          ACADEMIA: { title: 'QA基礎', skills: '社会人基礎力／QA基礎知識／テスト技法理解／テスト実施（指導下）', certs: 'JSTQB FL' },
          ENTRY: { title: '実行者', skills: 'テスト技法の基礎／Jira等バグ管理ツール／不具合起票', certs: 'IVEC アシスタント' },
          ASSOCIATE: { title: '設計者', skills: '高度なテスト設計技法／基本的な自動化ツール運用', certs: 'JSTQB TA / JCSQE初級' },
          PROFESSIONAL: { title: '推進者', skills: 'テスト戦略の策定／自動化フレームワーク構築', certs: 'JSTQB TM / JCSQE中級' },
          EXPERT: { title: 'マネージャー', skills: 'QAチームの採用・育成／予算管理／品質指標の定義化', certs: 'JCSQE上級' },
        },
      },
      {
        name: '自動化系',
        cells: {
          ENTRY: { title: '実行者', skills: 'テスト技法の基礎／不具合起票', certs: 'ITパスポート' },
          ASSOCIATE: { title: '自動化ユーザー', skills: 'ノーコード/録画でテスト作成／HTML理解', certs: 'Python3基礎 / Java Silver' },
          PROFESSIONAL: { title: '自動化エンジニア', skills: 'コードでテスト自動化／API・CI/CD', certs: 'JSTQB TAE / AWS CLF' },
          EXPERT: { title: 'QAアーキテクト', skills: '組織の自動化戦略立案／ROI管理', certs: 'AWS SAA / SAP' },
        },
      },
      {
        name: 'セキュリティ系',
        cells: {
          ASSOCIATE: { title: '侵害分析', skills: 'OWASP基礎／認証・認可の基本', certs: 'ISC2 CC' },
          PROFESSIONAL: { title: '防御設計', skills: '攻撃シナリオ設計／脆弱性連鎖分析', certs: '徳丸基礎試験' },
          EXPERT: { title: 'セキュリティレビュー・リード', skills: 'アクセス制御設計／組織改善推進', certs: 'CISSP' },
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
          ENTRY: { title: 'プログラマー', skills: 'プログラミング基礎／バージョン管理', certs: 'ITパスポート / Java 3級' },
          ASSOCIATE: { title: 'ジュニアエンジニア', skills: '基本設計／DB設計／API設計', certs: '基本情報 / Java Silver' },
          PROFESSIONAL: { title: 'シニアエンジニア', skills: '要件定義／顧客折衝', certs: '応用情報 / AWS SAA' },
          EXPERT: { title: 'システムコンサルタント', skills: 'ドメイン知識深化／業務コンサルティング', certs: 'SA試験' },
        },
      },
      {
        name: 'アーキテクチャ',
        cells: {
          PROFESSIONAL: { title: 'テックリード', skills: 'アーキテクチャ設計／技術選定', certs: '応用情報 / AWS SAP' },
          EXPERT: { title: 'チーフアーキテクト', skills: '全社技術戦略', certs: 'SA試験 / CKA' },
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
          ENTRY: { title: 'インフラオペレーター', skills: 'サーバ基本設定', certs: 'ITパスポート / AWS CLF / LPIC-1' },
          ASSOCIATE: { title: 'インフラエンジニア', skills: 'サーバ・NW設計', certs: '基本情報 / AWS SAA / CCNA' },
          PROFESSIONAL: { title: 'シニアインフラエンジニア', skills: '全体統括・管理', certs: '応用情報 / AWS DOP / CCNP' },
          EXPERT: { title: 'インフラアーキテクト', skills: '大規模設計', certs: 'NWスペシャリスト / AWS SAP / CKA' },
        },
      },
      {
        name: 'セキュリティ',
        cells: {
          PROFESSIONAL: { title: 'セキュリティエンジニア', skills: 'セキュリティ設計・運用', certs: '応用情報 / CCSP' },
          EXPERT: { title: 'セキュリティアーキテクト', skills: '組織セキュリティ戦略', certs: '情報処理安全確保支援士 / CISSP' },
        },
      },
    ],
  },
  {
    id: 'pm',
    name: 'プロジェクトマネージメント',
    color: '#8A6D1A',
    tracks: [
      {
        name: 'PM',
        cells: {
          ASSOCIATE: { title: 'PMO', skills: 'プロジェクト管理補佐', certs: '' },
          PROFESSIONAL: { title: 'PL', skills: '各領域リーダー', certs: '' },
          EXPERT: { title: 'PM', skills: 'プロジェクト統括', certs: 'PMP / ITサービスマネージャ' },
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
          ENTRY: { title: 'IT管理担当', skills: 'IT資産管理／ヘルプデスク', certs: '' },
          ASSOCIATE: { title: 'IT運用・改善担当', skills: '業務プロセス改善', certs: '' },
          PROFESSIONAL: { title: 'ITアドミン・DX推進', skills: 'DXプロジェクト推進', certs: '' },
          EXPERT: { title: 'IT戦略・DX企画', skills: '全社IT戦略立案', certs: '' },
        },
      },
      {
        name: 'カスタマーサポート',
        cells: {
          ENTRY: { title: 'サポート担当', skills: '問合せ対応', certs: '' },
          ASSOCIATE: { title: 'シニアサポート', skills: 'エスカレーション対応', certs: '' },
          PROFESSIONAL: { title: 'サポートリーダー', skills: 'チーム管理・改善', certs: '' },
          EXPERT: { title: 'CS責任者', skills: '顧客体験戦略', certs: '' },
        },
      },
      {
        name: 'データアナリスト',
        cells: {
          ENTRY: { title: 'データ収集担当', skills: 'データ抽出・集計', certs: '' },
          ASSOCIATE: { title: 'ジュニアアナリスト', skills: '分析・可視化', certs: '' },
          PROFESSIONAL: { title: 'シニアアナリスト', skills: '高度分析・提言', certs: '' },
          EXPERT: { title: 'データストラテジスト', skills: 'データ戦略立案', certs: '' },
        },
      },
      {
        name: 'マーケティング',
        cells: {
          ENTRY: { title: 'マーケ担当', skills: '施策実行補助', certs: '' },
          ASSOCIATE: { title: 'マーケター', skills: '施策企画・実行', certs: '' },
          PROFESSIONAL: { title: 'シニアマーケター', skills: '戦略立案', certs: '' },
          EXPERT: { title: 'マーケ責任者', skills: '全社マーケ統括', certs: '' },
        },
      },
    ],
  },
];

// ── Stage arrow colors ──
const STAGE_COLORS: Record<StageKey, string> = {
  ACADEMIA: '#6B7280',
  ENTRY: CYAN,
  ASSOCIATE: SEA_GREEN,
  PROFESSIONAL: '#E21776',
  EXPERT: '#8B5CF6',
};

// ── Component ──
export default function CareerMapPage() {
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());

  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedTracks(new Set());

  const hasSelection = selectedTracks.size > 0;

  const isTrackSelected = (groupId: string, trackIdx: number) => {
    return selectedTracks.has(`${groupId}:${trackIdx}`);
  };

  const getTrackOpacity = (groupId: string, trackIdx: number): number => {
    if (!hasSelection) return 1;
    return isTrackSelected(groupId, trackIdx) ? 1 : 0.2;
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>
        <h1 style={s.title}>Career Map</h1>
        <p style={s.subtitle}>Widsley エンジニア キャリアロードマップ</p>
      </div>

      {/* Track selector */}
      <div style={s.selectorBar}>
        <span style={s.selectorLabel}>トラック選択:</span>
        <div style={s.chips}>
          {TRACK_GROUPS.map(group =>
            group.tracks.map((track, tIdx) => {
              const id = `${group.id}:${tIdx}`;
              const active = selectedTracks.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleTrack(id)}
                  style={{
                    ...s.chip,
                    background: active ? group.color : '#f1f5f9',
                    color: active ? '#fff' : '#64748b',
                    borderColor: active ? group.color : '#cbd5e1',
                  }}
                >
                  {track.name}
                </button>
              );
            })
          )}
          {hasSelection && (
            <button onClick={clearSelection} style={s.clearBtn}>
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Scrollable grid */}
      <div style={s.scrollContainer}>
        <div style={s.grid}>
          {/* Stage headers */}
          <div style={s.headerRow}>
            <div style={s.rowLabel} />
            {STAGES.map((stage, i) => (
              <div key={stage.key} style={s.stageHeaderCell}>
                <div
                  style={{
                    ...s.arrow,
                    background: STAGE_COLORS[stage.key],
                    clipPath:
                      i < STAGES.length - 1
                        ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)'
                        : 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)',
                    ...(i === 0
                      ? { clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)' }
                      : {}),
                  }}
                >
                  <span style={s.arrowLabel}>{stage.label}</span>
                </div>
                <span style={s.period}>{stage.period}</span>
              </div>
            ))}
          </div>

          {/* Track groups */}
          {TRACK_GROUPS.map(group => (
            <div key={group.id} style={s.groupBlock}>
              {/* Group banner */}
              <div style={{ ...s.groupBanner, background: group.color }}>
                {group.name}
              </div>

              {/* Tracks */}
              {group.tracks.map((track, tIdx) => {
                const opacity = getTrackOpacity(group.id, tIdx);
                const trackId = `${group.id}:${tIdx}`;
                return (
                  <div
                    key={tIdx}
                    style={{
                      ...s.trackRow,
                      opacity,
                      transition: 'opacity 0.25s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleTrack(trackId)}
                  >
                    <div style={{ ...s.rowLabel, borderLeft: `4px solid ${group.color}` }}>
                      <span style={s.trackName}>{track.name}</span>
                    </div>
                    {STAGES.map(stage => {
                      const cell = track.cells[stage.key];
                      if (!cell) {
                        return (
                          <div key={stage.key} style={s.cell}>
                            <span style={s.dash}>-</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={stage.key}
                          style={{
                            ...s.cell,
                            borderTop: `3px solid ${group.color}`,
                          }}
                        >
                          <div style={s.cellTitle}>{cell.title}</div>
                          <div style={s.cellSkills}>{cell.skills}</div>
                          {cell.certs && (
                            <div style={s.cellCerts}>{cell.certs}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const COL_WIDTH = 210;
const LABEL_WIDTH = 140;

const s: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '24px 16px 64px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  titleBar: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  // Selector
  selectorBar: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: DEEP_BLUE,
    whiteSpace: 'nowrap',
    lineHeight: '30px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 16,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    lineHeight: '20px',
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 16,
    border: '1px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    cursor: 'pointer',
    lineHeight: '20px',
  },

  // Grid
  scrollContainer: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 8,
  },
  grid: {
    minWidth: LABEL_WIDTH + COL_WIDTH * 5 + 40,
  },

  // Header row
  headerRow: {
    display: 'flex',
    gap: 2,
    marginBottom: 8,
  },
  stageHeaderCell: {
    width: COL_WIDTH,
    minWidth: COL_WIDTH,
    textAlign: 'center',
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    color: '#fff',
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 1,
  },
  arrowLabel: {
    position: 'relative',
    zIndex: 1,
  },
  period: {
    display: 'block',
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Group
  groupBlock: {
    marginBottom: 16,
  },
  groupBanner: {
    color: '#fff',
    fontWeight: 800,
    fontSize: 14,
    padding: '6px 16px',
    borderRadius: '8px 8px 0 0',
    letterSpacing: 0.5,
  },

  // Track row
  trackRow: {
    display: 'flex',
    gap: 2,
    borderBottom: '1px solid #e2e8f0',
    background: '#fff',
  },
  rowLabel: {
    width: LABEL_WIDTH,
    minWidth: LABEL_WIDTH,
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
  },
  trackName: {
    fontSize: 12,
    fontWeight: 700,
    color: DEEP_BLUE,
    lineHeight: 1.3,
  },

  // Cell
  cell: {
    width: COL_WIDTH,
    minWidth: COL_WIDTH,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    background: '#fff',
  },
  dash: {
    color: '#cbd5e1',
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
    display: 'block',
    lineHeight: '60px',
  },
  cellTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: DEEP_BLUE,
  },
  cellSkills: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.4,
  },
  cellCerts: {
    fontSize: 10,
    color: '#fff',
    background: '#64748b',
    padding: '2px 6px',
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    lineHeight: 1.3,
  },
};
