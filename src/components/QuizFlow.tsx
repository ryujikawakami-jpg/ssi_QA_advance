import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skills, levels, assessments, answers as mockAnswers } from '../data/mockData';
import type { Answer } from '../types';

// Widsley brand colors
const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';
const GRADIENT = 'linear-gradient(135deg, #50DAB0, #3DB7E4)';

// Bubble config: score 5 (left) to score 1 (right)
const bubbleConfig = [
  { score: 5, size: 44, mobileSz: 36, color: SEA_GREEN },
  { score: 4, size: 36, mobileSz: 30, color: '#6FCFB8' },
  { score: 3, size: 28, mobileSz: 24, color: '#999' },
  { score: 2, size: 36, mobileSz: 30, color: '#6CBCDA' },
  { score: 1, size: 44, mobileSz: 36, color: CYAN },
];

export default function QuizFlow() {
  const { course_id } = useParams<{ course_id: string }>();
  const [searchParams] = useSearchParams();
  const resume = searchParams.get('resume') === '1';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Get skills for this course, sorted by level then no
  const courseSkills = skills
    .filter((s) => s.course_id === course_id)
    .sort((a, b) => {
      const la = levels.find((l) => l.id === a.level_id);
      const lb = levels.find((l) => l.id === b.level_id);
      return (la?.sort_order ?? 0) - (lb?.sort_order ?? 0) || a.no - b.no;
    });

  // Load existing answers if resuming
  const loadInitialAnswers = useCallback((): Record<number, number> => {
    if (!resume || !user) return {};
    const draft = assessments.find(
      (a) => a.user_id === user.id && a.course_id === course_id && a.status === 'draft'
    );
    if (!draft) return {};
    const existing: Record<number, number> = {};
    mockAnswers
      .filter((a) => a.assessment_id === draft.id)
      .forEach((a) => { existing[a.skill_id] = a.score; });
    return existing;
  }, [resume, user, course_id]);

  const [answerMap, setAnswerMap] = useState<Record<number, number>>(loadInitialAnswers);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null); // "skillId-score"

  const total = courseSkills.length;
  const answeredCount = Object.keys(answerMap).length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const allAnswered = answeredCount === total;

  // Determine which questions are unlocked
  // A question is unlocked if all previous questions have been answered
  const getUnlockedIndex = (): number => {
    for (let i = 0; i < courseSkills.length; i++) {
      if (!(courseSkills[i].id in answerMap)) return i;
    }
    return courseSkills.length; // all answered
  };
  const unlockedUpTo = getUnlockedIndex();

  const handleSelect = (skillId: number, score: number) => {
    const newMap = { ...answerMap, [skillId]: score };
    setAnswerMap(newMap);
    syncToMock(newMap);

    // Auto-scroll to next unanswered question
    const skillIndex = courseSkills.findIndex((s) => s.id === skillId);
    const nextIndex = skillIndex + 1;
    if (nextIndex < courseSkills.length && !(courseSkills[nextIndex].id in newMap)) {
      setTimeout(() => {
        questionRefs.current[nextIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 200);
    } else if (nextIndex >= courseSkills.length) {
      // All done — scroll to submit
      setTimeout(() => {
        document.getElementById('quiz-submit')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  };

  const syncToMock = (map: Record<number, number>) => {
    if (!user) return;
    let draft = assessments.find(
      (a) => a.user_id === user.id && a.course_id === course_id && a.status === 'draft'
    );
    if (!draft) {
      const newId = Math.max(...assessments.map((a) => a.id), 0) + 1;
      draft = {
        id: newId,
        user_id: user.id,
        course_id: course_id!,
        status: 'draft',
        submitted_at: null,
        created_at: new Date().toISOString(),
      };
      assessments.push(draft);
    }
    for (const [skillIdStr, score] of Object.entries(map)) {
      const skillId = Number(skillIdStr);
      const existing = mockAnswers.find(
        (a) => a.assessment_id === draft!.id && a.skill_id === skillId
      );
      if (existing) {
        existing.score = score;
      } else {
        const newAnswerId = Math.max(...mockAnswers.map((a) => a.id), 0) + 1;
        const newAnswer: Answer = {
          id: newAnswerId,
          assessment_id: draft!.id,
          skill_id: skillId,
          score,
        };
        mockAnswers.push(newAnswer);
      }
    }
  };

  const handleComplete = () => {
    navigate(`/course/${course_id}/dashboard`);
  };

  if (courseSkills.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: DEEP_BLUE }}>スキルが見つかりません</p>
      </div>
    );
  }

  // Group skills by level/category for section headers
  let lastLevelId: number | null = null;

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff' }}>
      {/* Sticky progress bar */}
      <div style={{
        height: 5,
        background: '#eee',
        position: 'sticky',
        top: 56,
        zIndex: 50,
      }}>
        <div style={{
          height: '100%',
          background: GRADIENT,
          borderRadius: '0 2px 2px 0',
          transition: 'width 0.4s ease',
          width: `${progress}%`,
        }} />
      </div>

      {/* Sticky counter bar */}
      <div style={{
        position: 'sticky',
        top: 61,
        zIndex: 49,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #eee',
        padding: '10px 0',
      }}>
        <div style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#888' }}>
              回答済み <b style={{ color: DEEP_BLUE }}>{answeredCount}</b> / {total}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: SEA_GREEN, fontWeight: 600 }}>人に教えられる</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {bubbleConfig.map((b) => (
                <div key={b.score} style={{
                  width: b.score === 3 ? 6 : 8,
                  height: b.score === 3 ? 6 : 8,
                  borderRadius: '50%',
                  background: b.color,
                  opacity: 0.6,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: CYAN, fontWeight: 600 }}>興味はある</span>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: isMobile ? '16px 16px 60px' : '24px 20px 80px',
      }}>
        {courseSkills.map((skill, idx) => {
          const level = levels.find((l) => l.id === skill.level_id);
          const isLocked = idx > unlockedUpTo;
          const isAnswered = skill.id in answerMap;
          const selectedScore = answerMap[skill.id] ?? null;

          // Section header when level changes
          let showSectionHeader = false;
          if (skill.level_id !== lastLevelId) {
            showSectionHeader = true;
            lastLevelId = skill.level_id;
          }

          return (
            <div key={skill.id}>
              {/* Section header */}
              {showSectionHeader && (
                <div style={{
                  padding: idx === 0 ? '0 0 16px' : '32px 0 16px',
                  borderBottom: `2px solid ${SEA_GREEN}30`,
                  marginBottom: 20,
                }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    background: GRADIENT,
                    padding: '5px 14px',
                    borderRadius: 999,
                  }}>
                    {level?.name}
                  </span>
                </div>
              )}

              {/* Question row */}
              <div
                ref={(el) => { questionRefs.current[idx] = el; }}
                style={{
                  position: 'relative',
                  padding: '20px 0',
                  borderBottom: '1px solid #f0f0f0',
                  opacity: isLocked ? 0.35 : 1,
                  pointerEvents: isLocked ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease',
                }}
              >
                {/* Lock overlay hint */}
                {isLocked && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}>
                    <span style={{
                      fontSize: 12,
                      color: '#aaa',
                      background: 'rgba(255,255,255,0.8)',
                      padding: '4px 12px',
                      borderRadius: 8,
                    }}>
                      前の質問に回答してください
                    </span>
                  </div>
                )}

                {/* Question text (top, left-aligned) */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: CYAN,
                      background: `${CYAN}12`,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}>
                      {skill.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#bbb' }}>
                      {idx + 1}/{total}
                    </span>
                    {isAnswered && (
                      <span style={{ fontSize: 11, color: SEA_GREEN, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: isMobile ? 15 : 16,
                    fontWeight: 700,
                    color: DEEP_BLUE,
                    lineHeight: 1.5,
                    marginBottom: 2,
                  }}>
                    {skill.name}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: '#888',
                    lineHeight: 1.6,
                  }}>
                    {skill.description}
                  </div>
                  {skill.ref_note && (
                    <div style={{ fontSize: 12, color: MAGENTA, marginTop: 2 }}>
                      {skill.ref_note}
                    </div>
                  )}
                </div>

                {/* Answer row: label - bubbles - label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? 8 : 14,
                }}>
                  <span style={{
                    fontSize: isMobile ? 10 : 12,
                    color: SEA_GREEN,
                    fontWeight: 600,
                    minWidth: isMobile ? 54 : 72,
                    textAlign: 'right',
                    lineHeight: 1.3,
                    flexShrink: 0,
                  }}>
                    人に教えられる
                  </span>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 10 : 16,
                  }}>
                    {bubbleConfig.map((b) => {
                      const isSelected = selectedScore === b.score;
                      const hoverKey = `${skill.id}-${b.score}`;
                      const isHovered = hoveredBubble === hoverKey;
                      const sz = isMobile ? b.mobileSz : b.size;

                      return (
                        <button
                          key={b.score}
                          onClick={() => handleSelect(skill.id, b.score)}
                          onMouseEnter={() => setHoveredBubble(hoverKey)}
                          onMouseLeave={() => setHoveredBubble(null)}
                          style={{
                            width: sz,
                            height: sz,
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? b.color : isHovered ? b.color : '#ddd'}`,
                            background: isSelected
                              ? b.color
                              : isHovered
                                ? `${b.color}20`
                                : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0,
                            outline: 'none',
                            flexShrink: 0,
                            transform: isHovered && !isSelected ? 'scale(1.1)' : 'scale(1)',
                          }}
                          aria-label={`スコア ${b.score}`}
                        />
                      );
                    })}
                  </div>

                  <span style={{
                    fontSize: isMobile ? 10 : 12,
                    color: CYAN,
                    fontWeight: 600,
                    minWidth: isMobile ? 54 : 72,
                    textAlign: 'left',
                    lineHeight: 1.3,
                    flexShrink: 0,
                  }}>
                    興味はある
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Submit section */}
        <div
          id="quiz-submit"
          style={{
            textAlign: 'center',
            padding: '48px 0 32px',
          }}
        >
          {allAnswered ? (
            <>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: DEEP_BLUE,
                marginBottom: 8,
              }}>
                全ての質問に回答しました！
              </div>
              <div style={{
                fontSize: 14,
                color: '#888',
                marginBottom: 24,
              }}>
                結果を確認しましょう
              </div>
              <button
                onClick={handleComplete}
                style={{
                  padding: '14px 48px',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#fff',
                  background: GRADIENT,
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  boxShadow: `0 6px 18px ${CYAN}40`,
                  transition: 'transform 0.15s',
                }}
              >
                結果を見る →
              </button>
            </>
          ) : (
            <div style={{
              fontSize: 14,
              color: '#bbb',
              padding: '20px 0',
            }}>
              全ての質問に回答すると結果を確認できます（残り {total - answeredCount} 問）
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
