import { useState } from 'react';
import type { CSSProperties } from 'react';

// ── Brand colors ──
const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';

// ── Types ──
type StageKey = 'ACADEMIA' | 'ENTRY' | 'ASSOCIATE' | 'PROFESSIONAL' | 'EXPERT';

interface StageInfo {
  key: StageKey;
  label: string;
  sublabel: string;
  period: string;
  description: string;
  gradient: string;
}

interface TrackCard {
  trackGroupId: string;
  trackName: string;
  trackColor: string;
  stage: StageKey;
  title: string;
  skills: string;
  certs?: string;
  /** unique id: groupId:trackIdx */
  cardId: string;
}

// ── Stage definitions ──
const STAGES: StageInfo[] = [
  {
    key: 'ACADEMIA',
    label: 'ACADEMIA',
    sublabel: 'IT未経験者',
    period: '0〜半年',
    description: 'アカデミア生として教育カリキュラムスコープ内',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  },
  {
    key: 'ENTRY',
    label: 'ENTRY',
    sublabel: 'IT初心者',
    period: '半年〜1年',
    description: '進みたい方向性を決めていない状態。どの分野でも役立つ学習/経験',
    gradient: `linear-gradient(135deg, ${CYAN} 0%, #2196F3 100%)`,
  },
  {
    key: 'ASSOCIATE',
    label: 'ASSOCIATE',
    sublabel: 'IT中級者',
    period: '1〜3年',
    description: '専門性高めれる学習をするか、共通スキルの習得に努める',
    gradient: `linear-gradient(135deg, ${SEA_GREEN} 0%, #26a69a 100%)`,
  },
  {
    key: 'PROFESSIONAL',
    label: 'PROFESSIONAL',
    sublabel: 'IT上級者',
    period: '3〜5年',
    description: '専門性を決めて、その領域の特化スキルを習熟',
    gradient: `linear-gradient(135deg, ${MAGENTA} 0%, #c2185b 100%)`,
  },
  {
    key: 'EXPERT',
    label: 'EXPERT',
    sublabel: 'ITエキスパート',
    period: '5年〜',
    description: '「この人に任せれば問題ない」の領域',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
  },
];

// ── Track group definitions ──
interface TrackGroupDef {
  id: string;
  name: string;
  color: string;
  tracks: {
    name: string;
    cells: Partial<Record<StageKey, { title: string; skills: string; certs?: string }>>;
  }[];
}

const TRACK_GROUPS: TrackGroupDef[] = [
  {
    id: 'qa',
    name: 'QAエンジニア',
    color: '#7B2FB0',
    tracks: [
      {
        name: 'QAエンジニア',
        cells: {
          ACADEMIA: { title: 'QA基礎', skills: '社会人基礎力／QA基礎知識／テスト技法理解', certs: 'JSTQB FL' },
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
          ASSOCIATE: { title: 'PMO', skills: 'プロジェクト管理補佐' },
          PROFESSIONAL: { title: 'PL', skills: '各領域リーダー' },
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
          ENTRY: { title: 'IT管理担当', skills: 'IT資産管理／ヘルプデスク' },
          ASSOCIATE: { title: 'IT運用・改善担当', skills: '業務プロセス改善' },
          PROFESSIONAL: { title: 'ITアドミン・DX推進', skills: 'DXプロジェクト推進' },
          EXPERT: { title: 'IT戦略・DX企画', skills: '全社IT戦略立案' },
        },
      },
      {
        name: 'カスタマーサポート',
        cells: {
          ENTRY: { title: 'CS担当者', skills: '問合せ対応' },
          ASSOCIATE: { title: 'CSアナリスト', skills: 'エスカレーション対応' },
          PROFESSIONAL: { title: 'CSスペシャリスト', skills: 'チーム管理・改善' },
          EXPERT: { title: 'CS企画・推進', skills: '顧客体験戦略' },
        },
      },
      {
        name: 'データアナリスト',
        cells: {
          ENTRY: { title: 'データオペレーター', skills: 'データ抽出・集計' },
          ASSOCIATE: { title: 'データアナリスト', skills: '分析・可視化' },
          PROFESSIONAL: { title: 'データコンサルタント', skills: '高度分析・提言' },
          EXPERT: { title: 'データストラテジスト', skills: 'データ戦略立案' },
        },
      },
      {
        name: 'マーケティング',
        cells: {
          ENTRY: { title: 'コンテンツ担当', skills: '施策実行補助' },
          ASSOCIATE: { title: 'マーケター', skills: '施策企画・実行' },
          PROFESSIONAL: { title: 'マーケティングプランナー', skills: '戦略立案' },
          EXPERT: { title: 'マーケティングストラテジスト', skills: '全社マーケ統括' },
        },
      },
    ],
  },
];

// ── Build flat card list per stage ──
function buildStageCards(): Record<StageKey, TrackCard[]> {
  const result: Record<StageKey, TrackCard[]> = {
    ACADEMIA: [],
    ENTRY: [],
    ASSOCIATE: [],
    PROFESSIONAL: [],
    EXPERT: [],
  };

  for (const group of TRACK_GROUPS) {
    for (let tIdx = 0; tIdx < group.tracks.length; tIdx++) {
      const track = group.tracks[tIdx];
      const cardId = `${group.id}:${tIdx}`;
      for (const stageKey of Object.keys(track.cells) as StageKey[]) {
        const cell = track.cells[stageKey];
        if (!cell) continue;
        result[stageKey].push({
          trackGroupId: group.id,
          trackName: track.name,
          trackColor: group.color,
          stage: stageKey,
          title: cell.title,
          skills: cell.skills,
          certs: cell.certs,
          cardId,
        });
      }
    }
  }

  return result;
}

const STAGE_CARDS = buildStageCards();



// ── Helper: get connecting stages for a cardId ──
function getCardStages(cardId: string): StageKey[] {
  const [groupId, trackIdxStr] = cardId.split(':');
  const trackIdx = parseInt(trackIdxStr, 10);
  const group = TRACK_GROUPS.find(g => g.id === groupId);
  if (!group || !group.tracks[trackIdx]) return [];
  return Object.keys(group.tracks[trackIdx].cells) as StageKey[];
}

// ── Component ──
export default function CareerMapPage() {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setSelectedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCards(new Set());
    setActiveGroupFilter(null);
  };

  const toggleGroupFilter = (groupId: string) => {
    setActiveGroupFilter(prev => (prev === groupId ? null : groupId));
  };

  const hasSelection = selectedCards.size > 0;

  // Determine if a card should be highlighted
  const isCardHighlighted = (card: TrackCard): boolean => {
    if (activeGroupFilter) return card.trackGroupId === activeGroupFilter;
    if (hasSelection) return selectedCards.has(card.cardId);
    return false;
  };

  const getCardOpacity = (card: TrackCard): number => {
    if (!hasSelection && !activeGroupFilter) return 1;
    return isCardHighlighted(card) ? 1 : 0.35;
  };

  // Build selected path summary
  const selectedPathCards: TrackCard[] = [];
  if (hasSelection) {
    for (const stage of STAGES) {
      for (const card of STAGE_CARDS[stage.key]) {
        if (selectedCards.has(card.cardId)) {
          selectedPathCards.push(card);
        }
      }
    }
  }

  // Check if a connector between two stages should be highlighted for a given cardId
  const isConnectorHighlighted = (cardId: string, fromStage: StageKey, toStage: StageKey): boolean => {
    const stages = getCardStages(cardId);
    const stageOrder: StageKey[] = ['ACADEMIA', 'ENTRY', 'ASSOCIATE', 'PROFESSIONAL', 'EXPERT'];
    const fromIdx = stageOrder.indexOf(fromStage);
    const toIdx = stageOrder.indexOf(toStage);
    if (fromIdx === -1 || toIdx === -1) return false;
    // Check if both stages (or stages between) contain this track
    const hasFrom = stages.includes(fromStage);
    const hasTo = stages.includes(toStage);
    return hasFrom && hasTo;
  };

  // Get connector color between stages for a given card
  const getConnectorInfo = (fromStageKey: StageKey, toStageKey: StageKey): { color: string; active: boolean }[] => {
    const connectors: { color: string; active: boolean }[] = [];
    const allCardIds = new Set<string>();

    // Collect all unique cardIds that span both stages
    for (const card of STAGE_CARDS[fromStageKey]) {
      allCardIds.add(card.cardId);
    }

    for (const cardId of allCardIds) {
      if (isConnectorHighlighted(cardId, fromStageKey, toStageKey)) {
        const [groupId] = cardId.split(':');
        const group = TRACK_GROUPS.find(g => g.id === groupId);
        const isActive = activeGroupFilter
          ? groupId === activeGroupFilter
          : hasSelection
            ? selectedCards.has(cardId)
            : false;
        if (group) {
          connectors.push({ color: group.color, active: isActive });
        }
      }
    }

    return connectors;
  };

  return (
    <div style={styles.page}>
      {/* Title */}
      <div style={styles.titleBar}>
        <h1 style={styles.title}>Career Roadmap</h1>
        <p style={styles.subtitle}>Widsley エンジニア キャリアロードマップ</p>
      </div>

      {/* Group filter chips */}
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>トラック:</span>
        <div style={styles.filterChips}>
          {TRACK_GROUPS.map(group => {
            const isActive = activeGroupFilter === group.id;
            return (
              <button
                key={group.id}
                onClick={() => toggleGroupFilter(group.id)}
                style={{
                  ...styles.filterChip,
                  background: isActive ? group.color : '#f1f5f9',
                  color: isActive ? '#fff' : '#475569',
                  borderColor: isActive ? group.color : '#cbd5e1',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: group.color,
                    marginRight: 6,
                    opacity: isActive ? 0 : 1,
                  }}
                />
                {group.name}
              </button>
            );
          })}
          {(hasSelection || activeGroupFilter) && (
            <button onClick={clearSelection} style={styles.clearBtn}>
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Roadmap flow */}
      <div style={styles.roadmap}>
        {STAGES.map((stage, stageIdx) => (
          <div key={stage.key}>
            {/* Stage header */}
            <div style={{ ...styles.stageSection }}>
              <div style={{ ...styles.stageHeader, background: stage.gradient }}>
                <div style={styles.stageHeaderTop}>
                  <span style={styles.stageName}>{stage.label}</span>
                  <span style={styles.stageBadge}>
                    {stage.sublabel} {stage.period}
                  </span>
                </div>
                <p style={styles.stageDesc}>{stage.description}</p>
              </div>

              {/* Cards for this stage */}
              {stage.key === 'ACADEMIA' ? (
                // ACADEMIA: single wide card
                <div style={styles.academiaCardWrap}>
                  {STAGE_CARDS.ACADEMIA.map(card => {
                    const opacity = getCardOpacity(card);
                    const highlighted = isCardHighlighted(card);
                    return (
                      <div
                        key={card.cardId + card.title}
                        onClick={() => toggleCard(card.cardId)}
                        onMouseEnter={() => setHoveredCard(card.cardId)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          ...styles.academiaCard,
                          borderLeft: `5px solid ${card.trackColor}`,
                          opacity,
                          boxShadow: highlighted
                            ? `0 0 0 2px ${card.trackColor}, 0 4px 20px ${card.trackColor}40`
                            : hoveredCard === card.cardId
                              ? '0 4px 16px rgba(0,0,0,0.12)'
                              : '0 2px 8px rgba(0,0,0,0.06)',
                          transform: hoveredCard === card.cardId ? 'translateY(-1px)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={styles.cardTitle}>{card.title}</div>
                        <div style={{ ...styles.cardGroup, color: card.trackColor }}>{card.trackName}</div>
                        <div style={styles.cardSkills}>{card.skills}</div>
                        {card.certs && <div style={styles.cardCerts}>{card.certs}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Other stages: cards in a flex grid
                <div style={styles.cardsGrid}>
                  {STAGE_CARDS[stage.key].map(card => {
                    const opacity = getCardOpacity(card);
                    const highlighted = isCardHighlighted(card);
                    return (
                      <div
                        key={card.cardId + card.title}
                        onClick={() => toggleCard(card.cardId)}
                        onMouseEnter={() => setHoveredCard(card.cardId)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          ...styles.trackCard,
                          borderLeft: `5px solid ${card.trackColor}`,
                          opacity,
                          boxShadow: highlighted
                            ? `0 0 0 2px ${card.trackColor}, 0 4px 20px ${card.trackColor}40`
                            : hoveredCard === card.cardId
                              ? '0 4px 16px rgba(0,0,0,0.12)'
                              : '0 2px 8px rgba(0,0,0,0.06)',
                          transform: hoveredCard === card.cardId ? 'translateY(-1px)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={styles.cardTitle}>{card.title}</div>
                        <div style={{ ...styles.cardGroup, color: card.trackColor }}>{card.trackName}</div>
                        <div style={styles.cardSkills}>{card.skills}</div>
                        {card.certs && <div style={styles.cardCerts}>{card.certs}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Connector lines between stages */}
            {stageIdx < STAGES.length - 1 && (
              <div style={styles.connectorSection}>
                {(() => {
                  const nextStage = STAGES[stageIdx + 1];
                  const connectors = getConnectorInfo(stage.key, nextStage.key);
                  const hasActiveConnector = connectors.some(c => c.active);
                  return (
                    <div style={styles.connectorRow}>
                      {connectors.length > 0 ? (
                        connectors.map((conn, ci) => (
                          <div
                            key={ci}
                            style={{
                              width: 3,
                              height: 40,
                              borderRadius: 2,
                              background: conn.active ? conn.color : hasActiveConnector ? '#e2e8f055' : '#cbd5e1',
                              margin: '0 4px',
                              transition: 'all 0.25s ease',
                              opacity: conn.active ? 1 : hasActiveConnector ? 0.3 : 0.5,
                            }}
                          />
                        ))
                      ) : (
                        <div
                          style={{
                            width: 3,
                            height: 40,
                            borderRadius: 2,
                            background: '#cbd5e1',
                            opacity: 0.5,
                          }}
                        />
                      )}
                      {/* Arrow indicator */}
                      <div style={styles.arrowDown}>
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                          <path
                            d="M7 10L0.5 0H13.5L7 10Z"
                            fill={
                              hasActiveConnector
                                ? connectors.find(c => c.active)?.color ?? '#cbd5e1'
                                : '#cbd5e1'
                            }
                            opacity={hasActiveConnector ? 1 : 0.5}
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating selected route summary */}
      {hasSelection && (
        <div style={styles.summaryPanel}>
          <div style={styles.summaryHeader}>
            <span style={styles.summaryTitle}>選択中のルート</span>
            <button onClick={clearSelection} style={styles.summaryClear}>
              クリア
            </button>
          </div>
          <div style={styles.summaryCards}>
            {selectedPathCards.map((card, idx) => (
              <div key={card.cardId + card.stage} style={styles.summaryItem}>
                <div
                  style={{
                    ...styles.summaryDot,
                    background: card.trackColor,
                  }}
                />
                <div style={styles.summaryInfo}>
                  <span style={styles.summaryStage}>{card.stage}</span>
                  <span style={styles.summaryRole}>{card.title}</span>
                  <span style={{ ...styles.summaryTrack, color: card.trackColor }}>{card.trackName}</span>
                </div>
                {idx < selectedPathCards.length - 1 && (
                  <div style={styles.summaryArrow}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──
const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 16px 120px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
  },
  titleBar: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: 0,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  // Filter bar
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap' as const,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: DEEP_BLUE,
    whiteSpace: 'nowrap' as const,
  },
  filterChips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    fontSize: 13,
    padding: '6px 14px',
    borderRadius: 20,
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    lineHeight: '20px',
    background: 'none',
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 20,
    border: '1.5px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    cursor: 'pointer',
    lineHeight: '20px',
  },

  // Roadmap
  roadmap: {
    display: 'flex',
    flexDirection: 'column',
  },

  // Stage section
  stageSection: {
    marginBottom: 0,
  },
  stageHeader: {
    padding: '16px 24px',
    borderRadius: 14,
    color: '#fff',
    marginBottom: 16,
  },
  stageHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'wrap' as const,
  },
  stageName: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 1,
  },
  stageBadge: {
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.2)',
    padding: '3px 10px',
    borderRadius: 12,
  },
  stageDesc: {
    fontSize: 13,
    margin: 0,
    opacity: 0.9,
    lineHeight: 1.5,
  },

  // Cards grid
  cardsGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    padding: '0 8px',
    justifyContent: 'center',
  },

  // ACADEMIA special layout
  academiaCardWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0 8px',
  },

  academiaCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 28px',
    cursor: 'pointer',
    maxWidth: 600,
    width: '100%',
    textAlign: 'center' as const,
  },

  // Track card
  trackCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '14px 16px',
    cursor: 'pointer',
    width: 180,
    minWidth: 160,
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: DEEP_BLUE,
    marginBottom: 2,
  },
  cardGroup: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 6,
  },
  cardSkills: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardCerts: {
    fontSize: 10,
    color: '#fff',
    background: '#64748b',
    padding: '2px 8px',
    borderRadius: 6,
    display: 'inline-block',
    marginTop: 6,
    lineHeight: 1.4,
  },

  // Connectors
  connectorSection: {
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 0',
  },
  connectorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  arrowDown: {
    position: 'absolute' as const,
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
  },

  // Summary panel
  summaryPanel: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    borderTop: `3px solid ${CYAN}`,
    boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
    padding: '14px 24px',
    zIndex: 1000,
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: DEEP_BLUE,
  },
  summaryClear: {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 12,
    border: '1px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    cursor: 'pointer',
  },
  summaryCards: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    overflowX: 'auto' as const,
    paddingBottom: 4,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  summaryInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  summaryStage: {
    fontSize: 9,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryRole: {
    fontSize: 12,
    fontWeight: 700,
    color: DEEP_BLUE,
    whiteSpace: 'nowrap' as const,
  },
  summaryTrack: {
    fontSize: 10,
    fontWeight: 600,
  },
  summaryArrow: {
    fontSize: 16,
    color: '#94a3b8',
    margin: '0 4px',
    flexShrink: 0,
  },
};
