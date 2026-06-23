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

const GAS_INVITE_URL = 'https://script.google.com/a/macros/widsley.com/s/AKfycbxr8eX3QoEK2z3HLsvYkXTnTDY8ViWTf3fUl9TqhhTS9N5FrybIabZMrWOncPr9BEFY/exec';

export async function sendInviteEmail(
  email: string,
  role: string,
  teamName: string,
  appUrl = 'https://app-two-gamma-56.vercel.app',
): Promise<{ success: boolean }> {
  const roleLabelMap: Record<string, string> = { member: 'メンバー', leader: 'リーダー', board: '管理者' };
  try {
    const params = new URLSearchParams({
      email,
      role: roleLabelMap[role] ?? role,
      team: teamName || '未割当',
      appUrl,
    });
    const url = `${GAS_INVITE_URL}?${params.toString()}`;

    // Use Image beacon - most reliable way to hit GAS without CORS issues
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ success: true });
      img.onerror = () => resolve({ success: true }); // GAS returns JSON, not image, so onerror fires but request was sent
      img.src = url;
      // Fallback timeout
      setTimeout(() => resolve({ success: true }), 5000);
    });
  } catch (err) {
    console.error('Failed to send invite email:', err);
    return { success: false };
  }
}

// ══════════════════════════════════════
// Certifications
// ══════════════════════════════════════

export interface CertificationRecord {
  id: number;
  name: string;
  description: string;
  level: string;
  category: string;
  reward: string | null;
  sort_order: number;
}

export interface UserCertification {
  id: number;
  user_id: string;
  certification_id: number;
  status: 'interested' | 'studying' | 'acquired';
  updated_at: string;
}

export async function fetchCertifications(): Promise<CertificationRecord[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('certifications').select('*').order('sort_order');
    if (error) throw error;
    return data as CertificationRecord[];
  }
  return [];
}

export async function fetchUserCertifications(userId?: string): Promise<UserCertification[]> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return [];
    let query = sb.from('user_certifications').select('*').order('updated_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data as UserCertification[];
  }
  return [];
}

export async function upsertUserCertification(userId: string, certId: number, status: string): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not available');
    const { error } = await sb
      .from('user_certifications')
      .upsert(
        { user_id: userId, certification_id: certId, status, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,certification_id' },
      );
    if (error) throw error;
    return;
  }
  throw new Error('Certification operations require Supabase');
}

export async function removeUserCertification(userId: string, certId: number): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb
      .from('user_certifications')
      .delete()
      .eq('user_id', userId)
      .eq('certification_id', certId);
    if (error) throw error;
    return;
  }
  throw new Error('Certification operations require Supabase');
}

// ── Admin CRUD for certifications ──

export async function createCertification(cert: Omit<CertificationRecord, 'id'>): Promise<CertificationRecord> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) throw new Error('Supabase not available');
    const { data, error } = await sb.from('certifications').insert(cert).select().single();
    if (error) throw error;
    return data as CertificationRecord;
  }
  throw new Error('Admin operations require Supabase');
}

export async function updateCertification(id: number, updates: Partial<CertificationRecord>): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('certifications').update(updates).eq('id', id);
    if (error) throw error;
    return;
  }
  throw new Error('Admin operations require Supabase');
}

export async function deleteCertification(id: number): Promise<void> {
  if (isSupabaseMode()) {
    const sb = await getSupabase();
    if (!sb) return;
    const { error } = await sb.from('certifications').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  throw new Error('Admin operations require Supabase');
}
