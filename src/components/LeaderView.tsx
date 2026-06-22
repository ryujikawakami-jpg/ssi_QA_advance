import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchProfiles, fetchTeams, fetchCourses, fetchAssessments, fetchAnswers, fetchSkills, fetchLevels, deleteAssessment } from '../lib/data';
import { calcRate, calcReachedLevel } from '../lib/score';
import type { Profile, Team, Course, Skill, Level, Assessment, Answer } from '../types';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';

interface MemberRow {
  id: string;
  name: string;
  courseRates: Record<string, { rate: number; level: string; lastDate: string; assessmentId: number | null }>;
}

export default function LeaderView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isBoard = user?.role === 'board';

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | 'all'>(isBoard ? 'all' : (user?.team_id ?? 'all'));
  const [courses, setCourses] = useState<Course[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<number, Answer[]>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [c, t, p, s, l, a] = await Promise.all([
        fetchCourses(),
        fetchTeams(),
        isBoard ? fetchProfiles() : fetchProfiles(user.team_id ?? undefined),
        fetchSkills(),
        fetchLevels(),
        fetchAssessments(),
      ]);
      setCourses(c);
      setTeams(t);
      setAllProfiles(p);
      setSkills(s);
      setLevels(l);

      // Filter by selected team
      const filteredProfiles = filterByTeam(p, selectedTeamId, user);
      setProfiles(filteredProfiles);

      const memberIds = new Set(filteredProfiles.map(pr => pr.id));
      const filteredAssessments = a.filter(as => memberIds.has(as.user_id));
      setAssessments(filteredAssessments);

      // Load answers for all submitted assessments
      const submittedAssessments = filteredAssessments.filter(as => as.status === 'submitted');
      const ansMap: Record<number, Answer[]> = {};
      await Promise.all(
        submittedAssessments.map(async (as) => {
          ansMap[as.id] = await fetchAnswers(as.id);
        })
      );
      setAnswersMap(ansMap);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedTeamId]);

  function filterByTeam(p: Profile[], teamId: number | 'all', currentUser: Profile): Profile[] {
    const filtered = currentUser.role === 'board'
      ? p.filter(pr => pr.role !== 'retired')
      : p.filter(pr => pr.team_id === currentUser.team_id && pr.role === 'member');
    if (teamId === 'all') return filtered;
    return filtered.filter(pr => pr.team_id === teamId);
  }

  // Re-filter when team selection changes
  useEffect(() => {
    if (!user || allProfiles.length === 0) return;
    const filteredProfiles = filterByTeam(allProfiles, selectedTeamId, user);
    setProfiles(filteredProfiles);
    const memberIds = new Set(filteredProfiles.map(pr => pr.id));
    setAssessments(prev => prev.filter(as => memberIds.has(as.user_id)));
  }, [selectedTeamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || (user.role !== 'leader' && user.role !== 'board')) {
    return <div style={styles.container}><p>アクセス権限がありません</p></div>;
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={{ color: '#999', marginTop: 12 }}>読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // Build member rows with per-course data
  const memberRows: MemberRow[] = profiles.map((member) => {
    const courseRates: MemberRow['courseRates'] = {};
    for (const course of courses) {
      const courseSkills = skills.filter(s => s.course_id === course.id);
      const courseLevels = levels.filter(l => l.course_id === course.id);

      const latestSubmitted = assessments
        .filter(a => a.user_id === member.id && a.course_id === course.id && a.status === 'submitted')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const memberAnswers = latestSubmitted ? (answersMap[latestSubmitted.id] ?? []) : [];
      const { rate } = calcRate(courseSkills, memberAnswers);
      const reachedLevel = course.type === 'leveled'
        ? calcReachedLevel(courseLevels, courseSkills, memberAnswers)
        : '-';

      courseRates[course.id] = {
        rate,
        level: reachedLevel,
        lastDate: latestSubmitted?.submitted_at
          ? new Date(latestSubmitted.submitted_at).toLocaleDateString('ja-JP')
          : '未提出',
        assessmentId: latestSubmitted?.id ?? null,
      };
    }
    return { id: member.id, name: member.display_name, courseRates };
  });

  const handleDelete = async (assessmentId: number, memberName: string) => {
    if (!confirm(`${memberName} の提出履歴を削除しますか？この操作は取り消せません。`)) return;
    const key = `${assessmentId}`;
    setDeleting(key);
    try {
      await deleteAssessment(assessmentId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  const avgRates: Record<string, number> = {};
  for (const course of courses) {
    const rates = memberRows.map(r => r.courseRates[course.id]?.rate ?? 0);
    avgRates[course.id] = rates.length > 0
      ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
      : 0;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h1 style={{ ...styles.title, marginBottom: 0 }}>チームビュー</h1>
          {isBoard && teams.length > 0 && (
            <select
              value={selectedTeamId}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTeamId(v === 'all' ? 'all' : Number(v));
              }}
              style={{
                padding: '8px 14px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                color: DEEP_BLUE,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">全チーム</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.statsBar}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{profiles.length}</div>
            <div style={styles.statLabel}>メンバー数</div>
          </div>
          {courses.map(c => (
            <div key={c.id} style={styles.stat}>
              <div style={styles.statValue}>{avgRates[c.id]}%</div>
              <div style={styles.statLabel}>{c.name} 平均</div>
            </div>
          ))}
        </div>

        <div style={styles.tableWrapper}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th}>メンバー名</th>
                  {courses.map(c => (
                    <th key={c.id} style={styles.th} colSpan={c.type === 'leveled' ? 2 : 1}>
                      {c.name}
                    </th>
                  ))}
                  <th style={styles.th}>最終提出日</th>
                  <th style={styles.th}>操作</th>
                </tr>
                <tr>
                  <th style={styles.thSub}></th>
                  {courses.map(c => (
                    c.type === 'leveled' ? (
                      <React.Fragment key={c.id}>
                        <th style={styles.thSub}>達成率</th>
                        <th style={styles.thSub}>レベル</th>
                      </React.Fragment>
                    ) : (
                      <th key={c.id} style={styles.thSub}>達成率</th>
                    )
                  ))}
                  <th style={styles.thSub}></th>
                  <th style={styles.thSub}></th>
                </tr>
              </thead>
              <tbody>
                {memberRows.length === 0 ? (
                  <tr>
                    <td colSpan={99} style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                      データがありません
                    </td>
                  </tr>
                ) : (
                  memberRows.map((row) => {
                    // Find the most recent submission date across all courses
                    const lastDates = courses
                      .map(c => row.courseRates[c.id]?.lastDate)
                      .filter(d => d && d !== '未提出');
                    const lastDate = lastDates.length > 0 ? lastDates[0] : '未提出';

                    // Find any deletable assessment (most recent submitted)
                    const deletableAssessment = courses
                      .map(c => row.courseRates[c.id])
                      .find(cr => cr?.assessmentId != null);

                    return (
                      <tr key={row.id} style={styles.tr}>
                        <td
                          style={{ ...styles.td, cursor: 'pointer', fontWeight: 600, color: DEEP_BLUE }}
                          onClick={() => {
                            const firstCourse = courses[0];
                            if (firstCourse) navigate(`/course/${firstCourse.id}/dashboard/${row.id}`);
                          }}
                        >
                          {row.name}
                        </td>
                        {courses.map(c => {
                          const cr = row.courseRates[c.id];
                          return c.type === 'leveled' ? (
                            <React.Fragment key={c.id}>
                              <td
                                style={{ ...styles.td, cursor: 'pointer' }}
                                onClick={() => navigate(`/course/${c.id}/dashboard/${row.id}`)}
                              >
                                <div style={styles.rateCell}>
                                  <div style={styles.rateBar}>
                                    <div style={{ ...styles.rateBarFill, width: `${cr?.rate ?? 0}%` }} />
                                  </div>
                                  <span style={styles.rateText}>{cr?.rate ?? 0}%</span>
                                </div>
                              </td>
                              <td
                                style={{ ...styles.td, cursor: 'pointer' }}
                                onClick={() => navigate(`/course/${c.id}/dashboard/${row.id}`)}
                              >
                                <span style={styles.levelBadge}>{cr?.level ?? '-'}</span>
                              </td>
                            </React.Fragment>
                          ) : (
                            <td
                              key={c.id}
                              style={{ ...styles.td, cursor: 'pointer' }}
                              onClick={() => navigate(`/course/${c.id}/dashboard/${row.id}`)}
                            >
                              <div style={styles.rateCell}>
                                <div style={styles.rateBar}>
                                  <div style={{ ...styles.rateBarFill, width: `${cr?.rate ?? 0}%` }} />
                                </div>
                                <span style={styles.rateText}>{cr?.rate ?? 0}%</span>
                              </div>
                            </td>
                          );
                        })}
                        <td style={styles.td}>{lastDate}</td>
                        <td style={styles.td}>
                          {deletableAssessment?.assessmentId != null && (
                            <button
                              style={{
                                ...styles.deleteBtn,
                                opacity: deleting === `${deletableAssessment.assessmentId}` ? 0.5 : 1,
                              }}
                              disabled={deleting !== null}
                              onClick={() => handleDelete(deletableAssessment.assessmentId!, row.name)}
                            >
                              {deleting === `${deletableAssessment.assessmentId}` ? '削除中...' : '提出履歴削除'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Need React import for Fragment
import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: 'calc(100vh - 56px)',
    padding: '24px 16px 48px',
  },
  content: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: DEEP_BLUE,
    marginBottom: 20,
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid #eee`,
    borderTop: `3px solid ${CYAN}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  statsBar: {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap' as const,
  },
  stat: {
    background: '#fff',
    borderRadius: 10,
    padding: '14px 24px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    minWidth: 120,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 800,
    color: DEEP_BLUE,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tableWrapper: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    fontSize: 13,
    fontWeight: 700,
    color: DEEP_BLUE,
    borderBottom: '2px solid #eee',
    background: '#fafbfc',
    whiteSpace: 'nowrap' as const,
  },
  thSub: {
    padding: '6px 14px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 600,
    color: '#999',
    borderBottom: '1px solid #eee',
    background: '#fafbfc',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '10px 14px',
    fontSize: 13,
    color: '#333',
    whiteSpace: 'nowrap' as const,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: 700,
    background: `${CYAN}15`,
    color: CYAN,
    padding: '3px 10px',
    borderRadius: 8,
    display: 'inline-block',
  },
  rateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rateBar: {
    width: 60,
    height: 6,
    background: '#eee',
    borderRadius: 3,
  },
  rateBarFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${SEA_GREEN}, ${CYAN})`,
    borderRadius: 3,
  },
  rateText: {
    fontSize: 13,
    fontWeight: 600,
    color: CYAN,
    whiteSpace: 'nowrap' as const,
  },
  deleteBtn: {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    color: '#e74c3c',
    background: '#ffeaea',
    border: '1px solid #f5c6cb',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
};
