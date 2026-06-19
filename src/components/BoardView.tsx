import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { courses, skills, levels, assessments, answers, profiles, teams } from '../data/mockData';
import { calcRate, calcReachedLevel } from '../lib/score';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const SHADES = ['#50DAB0', '#3DB7E4', '#03202F', '#E21776'];

export default function BoardView() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id ?? '');
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>('all');

  if (!user || user.role !== 'board') {
    return <div style={styles.container}><p>アクセス権限がありません</p></div>;
  }

  const course = courses.find((c) => c.id === selectedCourse);
  const courseSkills = skills.filter((s) => s.course_id === selectedCourse);
  const courseLevels = levels.filter((l) => l.course_id === selectedCourse);

  const filteredProfiles = selectedTeam === 'all'
    ? profiles
    : profiles.filter((p) => p.team_id === selectedTeam);

  const scoreRows = filteredProfiles.map((p) => {
    const latestSubmitted = assessments
      .filter((a) => a.user_id === p.id && a.course_id === selectedCourse && a.status === 'submitted')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const pAnswers = latestSubmitted
      ? answers.filter((a) => a.assessment_id === latestSubmitted.id)
      : [];

    const { rate } = calcRate(courseSkills, pAnswers);
    const reachedLevel = course?.type === 'leveled'
      ? calcReachedLevel(courseLevels, courseSkills, pAnswers)
      : '-';
    const team = teams.find((t) => t.id === p.team_id);

    return {
      id: p.id,
      name: p.display_name,
      team: team?.name ?? '-',
      role: p.role,
      level: reachedLevel,
      rate,
      submitted: latestSubmitted?.submitted_at
        ? new Date(latestSubmitted.submitted_at).toLocaleDateString('ja-JP')
        : '未提出',
    };
  });

  const levelDistribution = course?.type === 'leveled'
    ? (() => {
        const levelNames = courseLevels
          .filter((l) => l.kind === 'level')
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((l) => l.name);
        const dist: Record<string, number> = { '未到達': 0 };
        levelNames.forEach((n) => { dist[n] = 0; });

        filteredProfiles.forEach((p) => {
          const sub = assessments.find(
            (a) => a.user_id === p.id && a.course_id === selectedCourse && a.status === 'submitted'
          );
          const pAns = sub ? answers.filter((a) => a.assessment_id === sub.id) : [];
          const reached = calcReachedLevel(courseLevels, courseSkills, pAns);
          dist[reached] = (dist[reached] || 0) + 1;
        });

        return Object.entries(dist).map(([name, count]) => ({ name, count }));
      })()
    : [];

  const teamAvgData = teams.map((team) => {
    const members = profiles.filter((p) => p.team_id === team.id);
    const rates = members.map((m) => {
      const sub = assessments.find(
        (a) => a.user_id === m.id && a.course_id === selectedCourse && a.status === 'submitted'
      );
      const mAns = sub ? answers.filter((a) => a.assessment_id === sub.id) : [];
      return calcRate(courseSkills, mAns).rate;
    });
    const avg = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
    return { name: team.name, avg };
  });

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>全社ダッシュボード</h1>

        <div style={styles.filterRow}>
          <div>
            <label style={styles.filterLabel}>コース:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={styles.select}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.filterLabel}>チーム:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={styles.select}
            >
              <option value="all">全チーム</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Score table */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>全社得点一覧</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>チーム</th>
                  <th>ロール</th>
                  {course?.type === 'leveled' && <th>到達レベル</th>}
                  <th>達成率</th>
                  <th>最終提出日</th>
                </tr>
              </thead>
              <tbody>
                {scoreRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.team}</td>
                    <td>{row.role}</td>
                    {course?.type === 'leveled' && (
                      <td>
                        <span style={styles.levelBadge}>{row.level}</span>
                      </td>
                    )}
                    <td>
                      <div style={styles.rateCell}>
                        <div style={styles.rateBar}>
                          <div style={{ ...styles.rateBarFill, width: `${row.rate}%` }} />
                        </div>
                        <span style={styles.rateText}>{row.rate}%</span>
                      </div>
                    </td>
                    <td>{row.submitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.chartsRow}>
          {course?.type === 'leveled' && levelDistribution.length > 0 && (
            <div style={{ ...styles.section, flex: 1 }}>
              <h2 style={styles.sectionTitle}>レベル別人数サマリー</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={levelDistribution}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                    {levelDistribution.map((_, i) => (
                      <Cell key={i} fill={SHADES[i % SHADES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ ...styles.section, flex: 1 }}>
            <h2 style={styles.sectionTitle}>チーム別平均達成率</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamAvgData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="avg" fill={CYAN} radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Admin */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>管理</h2>
          <div style={styles.adminPlaceholder}>
            <div style={styles.adminCard}>
              <h3 style={styles.adminCardTitle}>ユーザー管理</h3>
              <p style={styles.adminCardDesc}>ユーザーの追加・編集・ロール変更</p>
              <div style={styles.adminCount}>{profiles.length}名</div>
            </div>
            <div style={styles.adminCard}>
              <h3 style={styles.adminCardTitle}>チーム管理</h3>
              <p style={styles.adminCardDesc}>チームの作成・メンバー割り当て</p>
              <div style={styles.adminCount}>{teams.length}チーム</div>
            </div>
            <div style={styles.adminCard}>
              <h3 style={styles.adminCardTitle}>コース管理</h3>
              <p style={styles.adminCardDesc}>コース・スキルの編集</p>
              <div style={styles.adminCount}>{courses.length}コース</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  filterRow: {
    display: 'flex',
    gap: 20,
    marginBottom: 24,
    flexWrap: 'wrap' as const,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#555',
    marginRight: 8,
  },
  select: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
  },
  section: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: DEEP_BLUE,
    marginBottom: 16,
  },
  chartsRow: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap' as const,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: 700,
    background: `${CYAN}15`,
    color: CYAN,
    padding: '3px 10px',
    borderRadius: 8,
  },
  rateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rateBar: {
    width: 80,
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
  adminPlaceholder: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  adminCard: {
    flex: '1 1 200px',
    background: `${CYAN}10`,
    border: `1px solid ${CYAN}25`,
    borderRadius: 10,
    padding: '16px 20px',
    minWidth: 180,
  },
  adminCardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: DEEP_BLUE,
    margin: '0 0 4px',
  },
  adminCardDesc: {
    fontSize: 12,
    color: '#888',
    margin: '0 0 12px',
  },
  adminCount: {
    fontSize: 24,
    fontWeight: 800,
    color: CYAN,
  },
};
