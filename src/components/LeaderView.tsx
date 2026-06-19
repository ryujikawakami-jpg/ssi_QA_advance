import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courses, skills, levels, assessments, answers, profiles, teams } from '../data/mockData';
import { calcRate, calcReachedLevel } from '../lib/score';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';

export default function LeaderView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id ?? '');

  if (!user || (user.role !== 'leader' && user.role !== 'board')) {
    return <div style={styles.container}><p>アクセス権限がありません</p></div>;
  }

  const team = teams.find((t) => t.id === user.team_id);
  const teamMembers = profiles.filter((p) => p.team_id === user.team_id && p.role === 'member');
  const course = courses.find((c) => c.id === selectedCourse);
  const courseSkills = skills.filter((s) => s.course_id === selectedCourse);
  const courseLevels = levels.filter((l) => l.course_id === selectedCourse);

  const memberRows = teamMembers.map((member) => {
    const latestSubmitted = assessments
      .filter((a) => a.user_id === member.id && a.course_id === selectedCourse && a.status === 'submitted')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const memberAnswers = latestSubmitted
      ? answers.filter((a) => a.assessment_id === latestSubmitted.id)
      : [];

    const { rate } = calcRate(courseSkills, memberAnswers);
    const reachedLevel = course?.type === 'leveled'
      ? calcReachedLevel(courseLevels, courseSkills, memberAnswers)
      : '-';

    return {
      id: member.id,
      name: member.display_name,
      level: reachedLevel,
      rate,
      lastUpdate: latestSubmitted?.submitted_at
        ? new Date(latestSubmitted.submitted_at).toLocaleDateString('ja-JP')
        : '未提出',
    };
  });

  const avgRate = memberRows.length > 0
    ? Math.round(memberRows.reduce((sum, r) => sum + r.rate, 0) / memberRows.length)
    : 0;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>{team?.name} - チームビュー</h1>

        <div style={styles.filterRow}>
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

        <div style={styles.statsBar}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{teamMembers.length}</div>
            <div style={styles.statLabel}>メンバー数</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{avgRate}%</div>
            <div style={styles.statLabel}>チーム平均達成率</div>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>メンバー名</th>
                <th>現在レベル</th>
                <th>達成率(%)</th>
                <th>最終更新日</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                    データがありません
                  </td>
                </tr>
              ) : (
                memberRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/course/${selectedCourse}/dashboard/${row.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{row.name}</td>
                    <td>
                      <span style={styles.levelBadge}>{row.level}</span>
                    </td>
                    <td>
                      <div style={styles.rateBar}>
                        <div style={{ ...styles.rateBarFill, width: `${row.rate}%` }} />
                      </div>
                      <span style={styles.rateText}>{row.rate}%</span>
                    </td>
                    <td>{row.lastUpdate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    maxWidth: 900,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#555',
  },
  select: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
  },
  statsBar: {
    display: 'flex',
    gap: 24,
    marginBottom: 24,
  },
  stat: {
    background: '#fff',
    borderRadius: 10,
    padding: '14px 24px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
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
  levelBadge: {
    fontSize: 12,
    fontWeight: 700,
    background: `${CYAN}15`,
    color: CYAN,
    padding: '3px 10px',
    borderRadius: 8,
  },
  rateBar: {
    display: 'inline-block',
    width: 80,
    height: 6,
    background: '#eee',
    borderRadius: 3,
    marginRight: 8,
    verticalAlign: 'middle',
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
  },
};
