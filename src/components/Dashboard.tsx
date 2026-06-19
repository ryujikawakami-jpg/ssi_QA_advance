import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { courses, skills, levels, assessments, answers } from '../data/mockData';
import { calcRate, checkGate, calcReachedLevel, getNextSkills } from '../lib/score';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const GRAY = '#e0e0e0';

export default function Dashboard() {
  const { course_id } = useParams<{ course_id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const course = courses.find((c) => c.id === course_id);
  if (!course || !user) return <div style={styles.container}><p>データがありません</p></div>;

  const courseSkills = skills.filter((s) => s.course_id === course_id);
  const courseLevels = levels.filter((l) => l.course_id === course_id);

  const userAssessments = assessments
    .filter((a) => a.user_id === user.id && a.course_id === course_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const latestAssessment = userAssessments[0];
  const latestAnswers = latestAssessment
    ? answers.filter((a) => a.assessment_id === latestAssessment.id)
    : [];

  const submittedAssessments = userAssessments.filter((a) => a.status === 'submitted');
  const { rate: overallRate } = calcRate(courseSkills, latestAnswers);

  const donutData = [
    { name: '達成', value: overallRate },
    { name: '残り', value: 100 - overallRate },
  ];

  const breakdownData = courseLevels
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((lv) => {
      const lvSkills = courseSkills.filter((s) => s.level_id === lv.id);
      const { rate } = calcRate(lvSkills, latestAnswers);
      const gate = checkGate(lvSkills, latestAnswers);
      return { name: lv.name, rate, gate: gate.gate, kind: lv.kind };
    });

  const reachedLevel = course.type === 'leveled'
    ? calcReachedLevel(courseLevels, courseSkills, latestAnswers)
    : null;

  const nextSkills = getNextSkills(courseSkills, latestAnswers, 3);

  // For single courses: gate check
  const singleGate = course.type === 'single'
    ? checkGate(courseSkills, latestAnswers)
    : null;

  const handleSubmit = () => {
    if (latestAssessment && latestAssessment.status === 'draft') {
      latestAssessment.status = 'submitted';
      latestAssessment.submitted_at = new Date().toISOString();
    }
    navigate(`/course/${course_id}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>{course.name} - マイダッシュボード</h1>

        {/* Overall ring + status */}
        <div style={styles.ringSection}>
          <div style={styles.ringCard}>
            <div style={styles.ringWrapper}>
              <PieChart width={180} height={180}>
                <Pie
                  data={donutData}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  <Cell fill={SEA_GREEN} />
                  <Cell fill={GRAY} />
                </Pie>
              </PieChart>
              <div style={styles.ringLabel}>
                <div style={styles.ringPercent}>{overallRate}%</div>
                <div style={styles.ringSubLabel}>総合達成率</div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              {/* Single course: gate status */}
              {course.type === 'single' && singleGate && (
                <>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px', borderRadius: 999,
                    background: singleGate.gate ? '#E7F6EE' : '#FFF3E0',
                    color: singleGate.gate ? '#1F8F58' : '#B97A1F',
                    fontWeight: 800, fontSize: 13.5, marginBottom: 12,
                  }}>
                    {singleGate.gate ? 'Entry昇格の要件を満たしています' : '継続学習中'}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#46546A', lineHeight: 1.7 }}>
                    昇格要件：JSTQB FL 合格 ＋ 総合達成率80%以上を推奨
                  </div>
                </>
              )}

              {/* Leveled course: reached level */}
              {course.type === 'leveled' && reachedLevel && (
                <>
                  <div style={{ fontSize: 12.5, color: '#8893A4', fontWeight: 700, marginBottom: 4 }}>現在の到達レベル</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: CYAN, marginBottom: 8 }}>{reachedLevel}</div>
                  <div style={{ fontSize: 13, color: '#46546A', lineHeight: 1.7 }}>
                    各レベルは「すべて評価2以上」で到達
                  </div>
                </>
              )}

              {latestAssessment && (
                <div style={styles.statusBadge}>
                  {latestAssessment.status === 'draft' ? '下書き' : '提出済み'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown chart */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {course.type === 'leveled' ? 'レベル別達成率' : 'カテゴリ別達成率'}
          </h2>

          {course.type === 'leveled' && (
            <div style={styles.gateBadges}>
              {breakdownData.filter(d => d.kind === 'level').map((d) => (
                <span
                  key={d.name}
                  style={{
                    ...styles.gateBadge,
                    background: d.gate ? '#dcfce7' : '#fee2e2',
                    color: d.gate ? '#166534' : '#991b1b',
                  }}
                >
                  {d.gate ? '✓' : '✗'} {d.name}
                </span>
              ))}
            </div>
          )}

          <ResponsiveContainer width="100%" height={breakdownData.length * 40 + 40}>
            <BarChart data={breakdownData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill={CYAN} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Next skills */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>次に伸ばすスキル</h2>
          {nextSkills.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14 }}>全スキルが高水準です。</p>
          ) : (
            <div style={styles.nextList}>
              {nextSkills.map((s, i) => {
                const ans = latestAnswers.find((a) => a.skill_id === s.id);
                const score = ans?.score ?? 0;
                return (
                  <div key={s.id} style={styles.nextItem}>
                    <div style={styles.nextRank}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.nextName}>{s.name}</div>
                      <div style={styles.nextMeta}>
                        {s.category} ・ 重み {s.weight} ・ 現在スコア: {score}/5
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        {latestAssessment?.status === 'draft' && (
          <button onClick={handleSubmit} style={styles.submitBtn}>
            提出する
          </button>
        )}

        {/* History */}
        {submittedAssessments.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>提出履歴</h2>
            <table>
              <thead>
                <tr>
                  <th>提出日</th>
                  <th>達成率</th>
                </tr>
              </thead>
              <tbody>
                {submittedAssessments.map((a) => {
                  const aAnswers = answers.filter((an) => an.assessment_id === a.id);
                  const { rate } = calcRate(courseSkills, aAnswers);
                  return (
                    <tr key={a.id}>
                      <td>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('ja-JP') : '-'}</td>
                      <td>{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tip */}
        <div style={styles.tipBox}>
          <div style={{ fontSize: 13, fontWeight: 800, color: CYAN, marginBottom: 6 }}>リーダーとの面談メモに</div>
          <div style={{ fontSize: 13.5, color: '#46546A', lineHeight: 1.7 }}>
            この結果をもとに、次に伸ばすスキルや学習内容を相談しましょう。
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
    maxWidth: 700,
    margin: '0 auto',
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: DEEP_BLUE,
    marginBottom: 24,
  },
  ringSection: {
    marginBottom: 24,
  },
  ringCard: {
    display: 'flex',
    gap: 22,
    alignItems: 'center',
    background: '#fff',
    border: '1px solid #e5eef5',
    borderRadius: 18,
    padding: 24,
    flexWrap: 'wrap' as const,
  },
  ringWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
  },
  ringLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
  },
  ringPercent: {
    fontSize: 32,
    fontWeight: 800,
    color: DEEP_BLUE,
  },
  ringSubLabel: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    marginTop: 12,
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 700,
    color: CYAN,
    background: `${CYAN}15`,
    padding: '3px 12px',
    borderRadius: 10,
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
  gateBadges: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  gateBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 8,
  },
  nextList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  nextItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: '#f0f6fa',
    borderRadius: 8,
  },
  nextRank: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 13,
    flexShrink: 0,
  },
  nextName: {
    fontWeight: 700,
    fontSize: 14,
    color: DEEP_BLUE,
  },
  nextMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  submitBtn: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    marginBottom: 20,
    boxShadow: `0 6px 18px ${CYAN}40`,
  },
  tipBox: {
    marginTop: 10,
    padding: '18px 20px',
    background: `${CYAN}10`,
    border: `1px solid ${CYAN}25`,
    borderRadius: 16,
  },
};
