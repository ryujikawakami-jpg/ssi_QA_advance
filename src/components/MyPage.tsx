import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchCertifications,
  fetchUserCertifications,
  upsertUserCertification,
  removeUserCertification,
  fetchCourses,
  fetchAssessments,
  fetchAnswers,
  fetchSkills,
  fetchLevels,
  fetchTeams,
} from '../lib/data';
import type { CertificationRecord, UserCertification } from '../lib/data';
import type { Course, Team, Skill, Level, Answer } from '../types';
import { calcRate, calcReachedLevel, checkAcademiaGraduation } from '../lib/score';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';

const roleLabelMap: Record<string, string> = {
  member: 'メンバー',
  leader: 'リーダー',
  board: '管理者',
  retired: '退職者',
};

const levelColors: Record<string, string> = {
  'Academia': '#6B7280',
  'Entry': CYAN,
  'Associate': SEA_GREEN,
  'Professional': MAGENTA,
  'Expert': '#8B5CF6',
};

interface CourseResult {
  course: Course;
  rate: number;
  reachedLevel: string | null;
}

export default function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState<string>('');
  const [courseResults, setCourseResults] = useState<CourseResult[]>([]);
  const [careerScope, setCareerScope] = useState<{ groupId: string; trackIdx: number; trackName: string } | null>(null);
  const [allCerts, setAllCerts] = useState<CertificationRecord[]>([]);
  const [userCerts, setUserCerts] = useState<UserCertification[]>([]);
  const [modalCert, setModalCert] = useState<CertificationRecord | null>(null);
  const [modalSource, setModalSource] = useState<'studying' | 'interested' | 'acquired' | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [teams, courses, certs, uc] = await Promise.all([
        fetchTeams(),
        fetchCourses(),
        fetchCertifications(),
        fetchUserCertifications(user.id),
      ]);

      // Team name
      const team = teams.find((t: Team) => t.id === user.team_id);
      setTeamName(team?.name ?? '未所属');

      // Course results
      const results: CourseResult[] = [];
      for (const course of courses) {
        const [assessments, skills, levels] = await Promise.all([
          fetchAssessments(user.id, course.id),
          fetchSkills(course.id),
          fetchLevels(course.id),
        ]);
        if (assessments.length === 0) {
          results.push({ course, rate: 0, reachedLevel: null });
          continue;
        }
        const latestAssessment = assessments[0];
        const answers: Answer[] = await fetchAnswers(latestAssessment.id);
        const { rate } = calcRate(skills, answers);

        let reachedLevel: string | null = null;
        if (course.type === 'single') {
          const { graduated } = checkAcademiaGraduation(skills as Skill[], answers);
          reachedLevel = graduated ? '修了' : null;
        } else {
          const reached = calcReachedLevel(levels as Level[], skills as Skill[], answers);
          reachedLevel = reached !== '未到達' ? reached : null;
        }

        results.push({ course, rate, reachedLevel });
      }
      setCourseResults(results);
      setAllCerts(certs);
      setUserCerts(uc);
    } catch (e) {
      console.error('Failed to load mypage data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`career_scope_${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { groupId: string; trackIdx: number; trackName: string };
        setCareerScope(parsed);
      }
    } catch {
      // ignore malformed data
    }
  }, [user]);

  const getCertById = (id: number): CertificationRecord | undefined =>
    allCerts.find(c => c.id === id);

  const studyingCerts = userCerts.filter(uc => uc.status === 'studying');
  const interestedCerts = userCerts.filter(uc => uc.status === 'interested');
  const acquiredCerts = userCerts.filter(uc => uc.status === 'acquired');

  // Group user certs by level for display
  const levelOrder = ['academia', 'entry', 'associate', 'professional', 'expert'];
  const levelLabelMap: Record<string, string> = { academia: 'Academia', entry: 'Entry', associate: 'Associate', professional: 'Professional', expert: 'Expert' };

  function groupByLevel(ucList: UserCertification[]) {
    return levelOrder
      .map(lvKey => {
        const certsInLevel = ucList
          .map(uc => getCertById(uc.certification_id))
          .filter((c): c is CertificationRecord => !!c && c.level === lvKey);
        return { levelKey: lvKey, label: levelLabelMap[lvKey] ?? lvKey, color: levelColors[levelLabelMap[lvKey] ?? ''] ?? '#666', certs: certsInLevel };
      })
      .filter(g => g.certs.length > 0);
  }

  const handleStatusChange = async (certId: number, newStatus: string) => {
    if (!user) return;
    await upsertUserCertification(user.id, certId, newStatus);
    setModalCert(null);
    setModalSource(null);
    await loadData();
  };

  const handleRemove = async (certId: number) => {
    if (!user) return;
    await removeUserCertification(user.id, certId);
    setModalCert(null);
    setModalSource(null);
    await loadData();
  };

  const openModal = (cert: CertificationRecord, source: 'studying' | 'interested' | 'acquired') => {
    setModalCert(cert);
    setModalSource(source);
  };

  const groupNameMap: Record<string, string> = {
    qa: 'QAエンジニア',
    app: 'アプリケーションエンジニア',
    infra: 'クラウドインフラエンジニア',
    pm: 'プロジェクトマネージメント',
    biz: 'ビジネス・推進',
  };

  const groupColorMap: Record<string, string> = {
    qa: '#7B2FB0',
    app: '#0E5A8A',
    infra: '#2E6B2E',
    pm: '#8A6D1A',
    biz: '#B5481F',
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#999' }}>読み込み中...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', padding: '24px 16px 60px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: DEEP_BLUE, marginBottom: 24 }}>マイページ</h1>

      {/* User info */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>ユーザー情報</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: DEEP_BLUE }}>{user.display_name}</div>
          <div style={{ fontSize: 13, color: '#888' }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 12, fontWeight: 700, background: '#e0f0f8', color: CYAN,
              padding: '3px 10px', borderRadius: 999,
            }}>
              {roleLabelMap[user.role] ?? user.role}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, background: '#f0f0f0', color: '#555',
              padding: '3px 10px', borderRadius: 999,
            }}>
              {teamName}
            </span>
          </div>
        </div>
      </section>

      {/* キャリアスコープ */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>キャリアスコープ</h2>
        {careerScope ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#fff',
                background: groupColorMap[careerScope.groupId] ?? '#666',
                padding: '4px 12px', borderRadius: 999,
              }}>
                {groupNameMap[careerScope.groupId] ?? careerScope.groupId}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: DEEP_BLUE }}>
                {careerScope.trackName}
              </span>
            </div>
            <span
              onClick={() => navigate('/career')}
              style={{
                fontSize: 13, color: CYAN, cursor: 'pointer', fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              スコープを変更
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>
              キャリアパスから目指す職種を選択してスコープしましょう
            </p>
            <span
              onClick={() => navigate('/career')}
              style={{
                fontSize: 13, color: CYAN, cursor: 'pointer', fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              キャリアマップを見る
            </span>
          </div>
        )}
      </section>

      {/* Course results */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>コース結果</h2>
        {courseResults.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>まだコースの受験結果がありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {courseResults.map(cr => (
              <div
                key={cr.course.id}
                onClick={() => navigate(`/course/${cr.course.id}/dashboard`)}
                style={{
                  padding: '14px 16px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #eee', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.15s',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: DEEP_BLUE }}>{cr.course.name}</div>
                  {cr.reachedLevel && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: SEA_GREEN,
                      background: '#ecfdf5', padding: '2px 8px', borderRadius: 999, marginTop: 4,
                      display: 'inline-block',
                    }}>
                      到達: {cr.reachedLevel}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 800,
                  color: cr.rate >= 80 ? SEA_GREEN : cr.rate >= 50 ? CYAN : '#aaa',
                }}>
                  {cr.rate}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Studying certs */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>習得を目指す資格</h2>
        {studyingCerts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>まだ習得を目指している資格はありません</p>
        ) : (
          groupByLevel(studyingCerts).map(g => (
            <div key={g.levelKey} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 6 }}>{g.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8 }}>
                {g.certs.map(cert => (
                  <button key={cert.id} onClick={() => openModal(cert, 'studying')} style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    background: '#eff6ff', border: `1px solid ${CYAN}40`,
                    color: DEEP_BLUE, fontSize: 13, fontWeight: 600,
                  }}>
                    {cert.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Interested certs */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>気になる資格</h2>
        {interestedCerts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>気になる資格はありません。資格表から追加してください</p>
        ) : (
          groupByLevel(interestedCerts).map(g => (
            <div key={g.levelKey} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 6 }}>{g.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8 }}>
                {g.certs.map(cert => (
                  <button key={cert.id} onClick={() => openModal(cert, 'interested')} style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    background: '#fdf2f8', border: `1px solid ${MAGENTA}40`,
                    color: DEEP_BLUE, fontSize: 13, fontWeight: 600,
                  }}>
                    {cert.name}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Acquired certs */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>所持資格一覧</h2>
        {acquiredCerts.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>まだ取得した資格はありません</p>
        ) : (
          groupByLevel(acquiredCerts).map(g => (
            <div key={g.levelKey} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 6 }}>{g.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8 }}>
                {g.certs.map(cert => (
                  <div key={cert.id} style={{
                    padding: '8px 14px', borderRadius: 10,
                    background: '#ecfdf5', border: `1px solid ${SEA_GREEN}40`,
                    color: DEEP_BLUE, fontSize: 13, fontWeight: 600,
                  }}>
                    {cert.name}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Modal */}
      {modalCert && modalSource && (
        <div
          onClick={() => { setModalCert(null); setModalSource(null); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DEEP_BLUE, marginBottom: 12 }}>
              {modalCert.name}
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                background: levelColors[modalCert.level] ?? '#666',
                padding: '3px 10px', borderRadius: 999,
              }}>
                {modalCert.level}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: categoryColors[modalCert.category] ?? '#666',
                background: `${categoryColors[modalCert.category] ?? '#666'}18`,
                padding: '3px 10px', borderRadius: 999,
              }}>
                {modalCert.category}
              </span>
            </div>

            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>
              {modalCert.description || '説明はまだありません'}
            </p>

            {/* Action buttons based on source section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modalSource === 'studying' && (
                <>
                  <button
                    onClick={() => handleStatusChange(modalCert.id, 'interested')}
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: '#fff', border: `1px solid #ddd`, color: '#888',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    気になるに戻す
                  </button>
                  <button
                    onClick={() => handleStatusChange(modalCert.id, 'acquired')}
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: SEA_GREEN, border: 'none', color: '#fff',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    資格習得した！
                  </button>
                </>
              )}
              {modalSource === 'interested' && (
                <>
                  <button
                    onClick={() => handleStatusChange(modalCert.id, 'studying')}
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: CYAN, border: 'none', color: '#fff',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    習得を目指す！
                  </button>
                  <button
                    onClick={() => handleRemove(modalCert.id)}
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: '#fff', border: `1px solid #ddd`, color: '#888',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    気になるを解除
                  </button>
                </>
              )}
              {modalSource === 'acquired' && (
                <div style={{
                  padding: '10px 16px', borderRadius: 8, background: '#ecfdf5',
                  color: SEA_GREEN, fontWeight: 700, fontSize: 14, textAlign: 'center',
                }}>
                  取得済み
                </div>
              )}
            </div>

            <button
              onClick={() => { setModalCert(null); setModalSource(null); }}
              style={{
                width: '100%', marginTop: 10, padding: '8px 16px', borderRadius: 8,
                background: '#f5f5f5', border: 'none', color: '#888',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
  border: '1px solid #eee',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: DEEP_BLUE,
  marginBottom: 14,
  paddingBottom: 8,
  borderBottom: '2px solid #f0f0f0',
};

const categoryColors: Record<string, string> = {
  '国家資格': '#dc2626',
  'QA推奨': SEA_GREEN,
  'ベンダー系': CYAN,
  'ベンダーニュートラル系': '#8B5CF6',
  'AI系': '#F59E0B',
  '社内認定資格': MAGENTA,
};
