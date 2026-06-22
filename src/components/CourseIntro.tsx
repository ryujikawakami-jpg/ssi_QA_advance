import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCourses, fetchSkills, fetchAssessments } from '../lib/data';
import type { Course, Assessment } from '../types';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';

export default function CourseIntro() {
  const { course_id } = useParams<{ course_id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [skillCount, setSkillCount] = useState(0);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!course_id || !user) return;
    loadData();
  }, [course_id, user]);

  async function loadData() {
    try {
      const [courses, skills, userAssessments] = await Promise.all([
        fetchCourses(),
        fetchSkills(course_id!),
        fetchAssessments(user!.id, course_id!),
      ]);
      setCourse(courses.find(c => c.id === course_id) ?? null);
      setSkillCount(skills.length);
      setAssessments(userAssessments);
    } catch (e) {
      console.error('Failed to load course:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#999' }}>読み込み中...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.container}>
        <p>コースが見つかりません</p>
      </div>
    );
  }

  const estimatedMin = Math.ceil(skillCount * 0.5);
  const hasSubmitted = assessments.some(a => a.status === 'submitted');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.typeBadge}>
          {course.type === 'leveled' ? 'レベル別診断' : '共通ベース診断'}
        </div>
        <h1 style={styles.title}>{course.name}</h1>
        <p style={styles.goal}>{course.goal}</p>
        <p style={styles.description}>{course.description}</p>

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>{skillCount}</div>
            <div style={styles.statLabel}>スキル数</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>約{estimatedMin}分</div>
            <div style={styles.statLabel}>所要時間</div>
          </div>
        </div>

        <div style={styles.note}>
          これは試験ではなく、現在地を自分でマーキングするチェックシートです。<br />
          全問回答しなくても途中で提出できます。
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate(`/course/${course_id}/quiz`)}
            style={styles.startBtn}
          >
            {hasSubmitted ? '再回答する →' : 'はじめる →'}
          </button>

          {hasSubmitted && (
            <Link
              to={`/course/${course_id}/dashboard`}
              style={styles.resultLink}
            >
              結果を見る
            </Link>
          )}
        </div>

        <Link to="/" style={styles.backLink}>← コース一覧に戻る</Link>
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
    textAlign: 'left' as const,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.7,
    margin: '0 0 24px',
    textAlign: 'left' as const,
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
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
  note: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 1.6,
    marginBottom: 24,
    padding: '12px 16px',
    background: '#f9f9f9',
    borderRadius: 8,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
    marginBottom: 20,
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
  resultLink: {
    fontSize: 14,
    color: CYAN,
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: 4,
  },
  backLink: {
    fontSize: 13,
    color: '#bbb',
    textDecoration: 'none',
  },
};
