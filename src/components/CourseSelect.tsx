import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCourses, fetchAssessments, fetchAnswers, fetchSkills, fetchLevels } from '../lib/data';
import { calcRate, calcReachedLevel, checkAcademiaGraduation } from '../lib/score';
import type { Course, Assessment } from '../types';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';

interface CourseStatus {
  course: Course;
  latestAssessment: Assessment | null;
  rate: number | null;
  reachedLevel: string | null;
  graduated: boolean;
  jstqbPassed: boolean;
}

export default function CourseSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courseStatuses, setCourseStatuses] = useState<CourseStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [courses, allSkills, allLevels] = await Promise.all([
        fetchCourses(),
        fetchSkills(),
        fetchLevels(),
      ]);

      const statuses: CourseStatus[] = [];

      for (const course of courses) {
        const assessments = await fetchAssessments(user!.id, course.id);
        const latest = assessments.length > 0 ? assessments[0] : null;
        let rate: number | null = null;
        let reachedLevel: string | null = null;
        let graduated = false;
        let jstqbPassed = false;

        if (latest) {
          const answers = await fetchAnswers(latest.id);
          const courseSkills = allSkills.filter(s => s.course_id === course.id);
          const courseLevels = allLevels.filter(l => l.course_id === course.id);

          const result = calcRate(courseSkills, answers);
          rate = result.rate;

          if (course.type === 'leveled') {
            reachedLevel = calcReachedLevel(courseLevels, courseSkills, answers);
          } else {
            const grad = checkAcademiaGraduation(courseSkills, answers);
            graduated = grad.graduated;
            jstqbPassed = grad.jstqbPassed;
          }
        }

        statuses.push({ course, latestAssessment: latest, rate, reachedLevel, graduated, jstqbPassed });
      }

      setCourseStatuses(statuses);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', padding: '24px 16px 60px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: DEEP_BLUE, margin: '0 0 8px' }}>
          コース選択
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.6 }}>
          目指したいキャリアに合わせてコースを選択してください。<br />
          <span style={{ color: SEA_GREEN, fontWeight: 600 }}>複数コースを同時に進めることもできます。</span>
        </p>
      </div>

      {/* Team unassigned banner */}
      {user && !user.team_id && (
        <div style={{
          background: '#FFF3CD',
          border: '1px solid #FFEEBA',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 24,
          fontSize: 13,
          color: '#856404',
        }}>
          チームが未割当です。管理者に連絡してチーム設定を依頼してください。（チーム未割当でもコース回答は可能です）
        </div>
      )}

      {/* Course cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {courseStatuses.map(({ course, latestAssessment, rate, reachedLevel, graduated, jstqbPassed }) => (
          <div
            key={course.id}
            onClick={() => navigate(`/course/${course.id}`)}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '28px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              border: '1px solid #f0f0f0',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
            }}
          >
            {/* Type badge */}
            <div style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              color: course.type === 'leveled' ? CYAN : SEA_GREEN,
              background: course.type === 'leveled' ? `${CYAN}12` : `${SEA_GREEN}12`,
              padding: '3px 10px',
              borderRadius: 8,
              marginBottom: 12,
            }}>
              {course.type === 'leveled' ? 'レベル別' : '共通ベース'}
            </div>

            {/* Graduation badge */}
            {graduated && (
              <span style={{
                position: 'absolute',
                top: 16,
                right: 16,
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                background: SEA_GREEN,
                padding: '3px 10px',
                borderRadius: 8,
              }}>
                卒業済み
              </span>
            )}

            <h2 style={{ fontSize: 18, fontWeight: 800, color: DEEP_BLUE, margin: '0 0 8px' }}>
              {course.name}
            </h2>

            <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6, margin: '0 0 4px', minHeight: 40 }}>
              {course.description}
            </p>

            <p style={{ fontSize: 12, color: SEA_GREEN, fontWeight: 600, margin: '0 0 16px', lineHeight: 1.5 }}>
              {course.goal}
            </p>

            {/* Status */}
            {latestAssessment ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #f0f0f0',
                paddingTop: 14,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>達成率</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: DEEP_BLUE }}>
                    {rate !== null ? `${rate}%` : '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    {course.type === 'leveled' ? '到達レベル' : 'ステータス'}
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: course.type === 'leveled'
                      ? (reachedLevel !== '未到達' ? CYAN : '#ccc')
                      : (graduated ? SEA_GREEN : MAGENTA),
                  }}>
                    {course.type === 'leveled'
                      ? (reachedLevel ?? '-')
                      : (graduated ? 'JSTQB FL取得済み' : (jstqbPassed ? '達成率不足' : 'Academia生'))
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                borderTop: '1px solid #f0f0f0',
                paddingTop: 14,
                fontSize: 13,
                color: '#ccc',
                fontWeight: 600,
              }}>
                未回答
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
