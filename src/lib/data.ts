/**
 * Data access layer - abstracts Supabase/mock data access.
 * When VITE_SUPABASE_URL is set, fetches from Supabase.
 * Otherwise, uses mock data for development/demo.
 */

import type { Course, Level, Skill, Team, Profile, Assessment, Answer } from '../types';

// Lazy-load supabase client only when available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = undefined;
async function getSupabase() {
  if (_supabase === undefined) {
    const mod = await import('./supabase');
    _supabase = mod.supabase ?? null;
  }
  return _supabase;
}

function isSupabaseMode(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// ── Mock data imports (tree-shaken in production with Supabase) ──
async function getMockData() {
  const mod = await import('../data/mockData');
  return mod;
}

// ══════════════════════════════════════
// Courses
// ══════════════════════════════════════
export async function fetchCourses(): Promise<Course[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('courses').select('*').order('sort_order');
    if (error) throw error;
    return data as Course[];
  }
  const mock = await getMockData();
  return mock.courses;
}

// ══════════════════════════════════════
// Levels
// ══════════════════════════════════════
export async function fetchLevels(courseId?: string): Promise<Level[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    let query = sb.from('levels').select('*').order('sort_order');
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Level[];
  }
  const mock = await getMockData();
  return courseId ? mock.levels.filter(l => l.course_id === courseId) : mock.levels;
}

// ══════════════════════════════════════
// Skills
// ══════════════════════════════════════
export async function fetchSkills(courseId?: string): Promise<Skill[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    let query = sb.from('skills').select('*').order('no');
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      answer_type: s.answer_type ?? 'scale5',
      score_excluded: s.score_excluded ?? false,
    })) as Skill[];
  }
  const mock = await getMockData();
  const skills = courseId ? mock.skills.filter(s => s.course_id === courseId) : mock.skills;
  // Add default values for mock data compatibility
  return skills.map(s => ({
    ...s,
    answer_type: (s as Skill).answer_type ?? 'scale5',
    score_excluded: (s as Skill).score_excluded ?? false,
  }));
}

// ══════════════════════════════════════
// Teams
// ══════════════════════════════════════
export async function fetchTeams(): Promise<Team[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('teams').select('*').order('name');
    if (error) throw error;
    return data as Team[];
  }
  const mock = await getMockData();
  return mock.teams;
}

// ══════════════════════════════════════
// Profiles
// ══════════════════════════════════════
export async function fetchProfiles(teamId?: number): Promise<Profile[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    let query = sb.from('profiles').select('*').neq('role', 'retired');
    if (teamId) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Profile[];
  }
  const mock = await getMockData();
  const profiles = mock.profiles.filter(p => p.role !== 'retired');
  return teamId ? profiles.filter(p => p.team_id === teamId) : profiles;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return data as Profile;
  }
  const mock = await getMockData();
  return mock.profiles.find(p => p.id === userId) ?? null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
  }
}

// ══════════════════════════════════════
// Assessments
// ══════════════════════════════════════
export async function fetchAssessments(userId?: string, courseId?: string): Promise<Assessment[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    let query = sb.from('assessments').select('*').order('submitted_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Assessment[];
  }
  const mock = await getMockData();
  let assessments = [...mock.assessments];
  if (userId) assessments = assessments.filter(a => a.user_id === userId);
  if (courseId) assessments = assessments.filter(a => a.course_id === courseId);
  return assessments;
}

export async function fetchLatestAssessment(userId: string, courseId: string): Promise<Assessment | null> {
  const assessments = await fetchAssessments(userId, courseId);
  return assessments.length > 0 ? assessments[0] : null;
}

// ══════════════════════════════════════
// Answers
// ══════════════════════════════════════
export async function fetchAnswers(assessmentId: number): Promise<Answer[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('answers').select('*').eq('assessment_id', assessmentId);
    if (error) throw error;
    return data as Answer[];
  }
  const mock = await getMockData();
  return mock.answers.filter(a => a.assessment_id === assessmentId);
}

export async function fetchLatestAnswers(userId: string, courseId: string): Promise<Answer[]> {
  const assessment = await fetchLatestAssessment(userId, courseId);
  if (!assessment) return [];
  return fetchAnswers(assessment.id);
}

// ══════════════════════════════════════
// Submit Assessment
// ══════════════════════════════════════
export async function submitAssessment(
  userId: string,
  courseId: string,
  answerMap: Record<number, number>,
  scoreSnapshot: Record<string, unknown>,
): Promise<{ assessmentId: number }> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not available');

    // Create assessment
    const { data: assessment, error: aErr } = await sb
      .from('assessments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score_snapshot: scoreSnapshot,
      })
      .select()
      .single();
    if (aErr) throw aErr;

    // Create answers
    const answersToInsert = Object.entries(answerMap).map(([skillId, score]) => ({
      assessment_id: assessment.id,
      skill_id: Number(skillId),
      score,
    }));

    if (answersToInsert.length > 0) {
      const { error: ansErr } = await sb.from('answers').insert(answersToInsert);
      if (ansErr) throw ansErr;
    }

    return { assessmentId: assessment.id };
  }

  // Mock mode
  const mock = await getMockData();
  const newId = Math.max(...mock.assessments.map(a => a.id), 0) + 1;
  const newAssessment: Assessment = {
    id: newId,
    user_id: userId,
    course_id: courseId,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    score_snapshot: scoreSnapshot,
  };
  mock.assessments.push(newAssessment);

  for (const [skillIdStr, score] of Object.entries(answerMap)) {
    const newAnswerId = Math.max(...mock.answers.map(a => a.id), 0) + 1;
    mock.answers.push({
      id: newAnswerId,
      assessment_id: newId,
      skill_id: Number(skillIdStr),
      score,
    });
  }

  return { assessmentId: newId };
}

// ══════════════════════════════════════
// Delete Assessment (leader/board only)
// ══════════════════════════════════════
export async function deleteAssessment(assessmentId: number): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('assessments').delete().eq('id', assessmentId);
    if (error) throw error;
  }
}

// ══════════════════════════════════════
// Admin: Teams CRUD
// ══════════════════════════════════════
export async function createTeam(name: string): Promise<Team> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not available');
    const { data, error } = await sb.from('teams').insert({ name }).select().single();
    if (error) throw error;
    return data as Team;
  }
  throw new Error('Admin operations require Supabase');
}

export async function updateTeam(id: number, name: string): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('teams').update({ name }).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteTeam(id: number): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('teams').delete().eq('id', id);
    if (error) throw error;
  }
}

// ══════════════════════════════════════
// Invitations
// ══════════════════════════════════════
export interface Invitation {
  id: number;
  email: string;
  role: string;
  team_id: number | null;
  invited_by: string | null;
  status: string;
  created_at: string;
}

export async function fetchInvitations(): Promise<Invitation[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('invitations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Invitation[];
  }
  return [];
}

export async function createInvitation(email: string, role: string, teamId: number | null, invitedBy: string): Promise<Invitation> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not available');
    const { data, error } = await sb
      .from('invitations')
      .insert({ email: email.toLowerCase().trim(), role, team_id: teamId, invited_by: invitedBy, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data as Invitation;
  }
  throw new Error('Invitations require Supabase');
}

export async function deleteInvitation(id: number): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('invitations').delete().eq('id', id);
    if (error) throw error;
  }
}

const GAS_INVITE_URL = 'https://script.google.com/a/macros/widsley.com/s/AKfycbwtSswuooeOs_cJRenwadMaURfUQ4OSxUYfw2GCr1XpiaW-XCWxSpGjgAg5Inz9rmCX/exec';

export async function sendInviteEmail(
  email: string,
  role: string,
  teamName: string,
  appUrl = 'https://app-two-gamma-56.vercel.app',
): Promise<{ success: boolean }> {
  const roleLabelMap: Record<string, string> = { member: 'メンバー', leader: 'リーダー', board: '管理者' };
  try {
    // Use GET with query params to avoid CORS issues with GAS
    const params = new URLSearchParams({
      email,
      role: roleLabelMap[role] ?? role,
      team: teamName || '未割当',
      appUrl,
    });
    // Open in hidden iframe to bypass CORS (GAS redirects on GET)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${GAS_INVITE_URL}?${params.toString()}`;
    document.body.appendChild(iframe);
    // Clean up after 10 seconds
    setTimeout(() => iframe.remove(), 10000);
    return { success: true };
  } catch (err) {
    console.error('Failed to send invite email:', err);
    return { success: false };
  }
}
