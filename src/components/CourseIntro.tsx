import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courses, skills, assessments } from '../data/mockData';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';

export default function CourseIntro() {
  const { course_id } = useParams<{ course_id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const course = courses.find((c) => c.id === course_id);
  if (!course) return <div style={styles.container}><p>コースが見つかりません</p></div>;

  const courseSkills = skills.filter((s) => s.course_id === course_id);
  const estimatedMin = Math.ceil(courseSkills.length * 0.5);

  const userAssessments = user
    ? assessments.filter((a) => a.user_id === user.id && a.course_id === course_id)
    : [];
  const draft = userAssessments.find((a) => a.status === 'draft');
  const submitted = userAssessments.find((a) => a.status === 'submitted');
  const answeredCount = userAssessments.length > 0 ? 'あり' : null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.typeBadge}>{course.type === 'leveled' ? 'レベル別診断' : '共通ベース診断'}</div>
        <h1 style={styles.title}>{course.name}</h1>
        <p style={styles.goal}>{course.goal}</p>
        <p style={styles.description}>{course.description}</p>

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{courseSkills.length}</div>
            <div style={styles.statLabel}>スキル数</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>約{estimatedMin}分</div>
            <div style={styles.statLabel}>所要時間</div>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate(`/course/${course_id}/quiz`)}
            style={styles.startBtn}
          >
            {answeredCount ? '続きから回答する →' : 'はじめる →'}
          </button>

          {draft && (
            <button
              onClick={() => navigate(`/course/${course_id}/quiz?resume=1`)}
              style={styles.resumeBtn}
            >
              続きから
            </button>
          )}

          {(submitted || draft) && (
            <Link
              to={`/course/${course_id}/dashboard`}
              style={styles.resultLink}
            >
              結果を見る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: 'calc(100vh - 56px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '48px 40px',
    maxWidth: 520,
    width: '100%',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    textAlign: 'center' as const,
  },
  typeBadge: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 700,
    color: CYAN,
    background: `${CYAN}15`,
    padding: '3px 12px',
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: '0 0 8px',
  },
  goal: {
    fontSize: 15,
    color: SEA_GREEN,
    fontWeight: 600,
    margin: '0 0 12px',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.7,
    margin: '0 0 32px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 32,
  },
  statItem: {
    textAlign: 'center' as const,
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
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    boxShadow: `0 6px 18px ${CYAN}40`,
  },
  resumeBtn: {
    width: '100%',
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 600,
    color: CYAN,
    background: '#fff',
    border: `1.5px solid ${CYAN}`,
    borderRadius: 999,
    cursor: 'pointer',
  },
  resultLink: {
    fontSize: 14,
    color: CYAN,
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: 4,
  },
};
