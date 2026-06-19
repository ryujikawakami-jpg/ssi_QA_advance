import type { Skill, Answer, Level } from '../types';

// Calculate weighted score and rate for a set of skills and answers
export function calcRate(skills: Skill[], answers: Answer[]): { got: number; max: number; rate: number } {
  const answerMap = new Map(answers.map(a => [a.skill_id, a.score]));
  const max = skills.reduce((sum, s) => sum + s.weight * 5, 0);
  const got = skills.reduce((sum, s) => sum + s.weight * (answerMap.get(s.id) || 0), 0);
  const rate = max > 0 ? Math.round(got / max * 100) : 0;
  return { got, max, rate };
}

// Gate check for a level
export function checkGate(skills: Skill[], answers: Answer[]): { allAnswered: boolean; hasOne: boolean; gate: boolean } {
  const answerMap = new Map(answers.map(a => [a.skill_id, a.score]));
  const allAnswered = skills.every(s => answerMap.has(s.id));
  const hasOne = skills.some(s => (answerMap.get(s.id) || 0) === 1);
  const gate = allAnswered && !hasOne;
  return { allAnswered, hasOne, gate };
}

// Determine reached level for leveled courses
export function calcReachedLevel(levels: Level[], skills: Skill[], answers: Answer[]): string {
  const sortedLevels = [...levels].filter(l => l.kind === 'level').sort((a, b) => a.sort_order - b.sort_order);
  let reached = '未到達';
  for (const level of sortedLevels) {
    const levelSkills = skills.filter(s => s.level_id === level.id);
    const { gate } = checkGate(levelSkills, answers);
    if (gate) {
      reached = level.name;
    } else {
      break;
    }
  }
  return reached;
}

// Get suggestion for next skills to improve
export function getNextSkills(skills: Skill[], answers: Answer[], count = 3): Skill[] {
  const answerMap = new Map(answers.map(a => [a.skill_id, a.score]));
  return skills
    .filter(s => (answerMap.get(s.id) || 0) < 4)
    .sort((a, b) => {
      const scoreA = answerMap.get(a.id) || 0;
      const scoreB = answerMap.get(b.id) || 0;
      // Prioritize higher weight skills with lower scores
      return (b.weight - a.weight) || (scoreA - scoreB);
    })
    .slice(0, count);
}
