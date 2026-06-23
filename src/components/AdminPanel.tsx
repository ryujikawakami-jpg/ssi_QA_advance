import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import type { Profile, Team, Course, Level, Skill, RoleType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  fetchProfiles,
  updateProfile,
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchCourses,
  fetchLevels,
  fetchSkills,
  fetchInvitations,
  createInvitation,
  deleteInvitation,
  sendInviteEmail,
  fetchCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} from '../lib/data';
import type { Invitation, CertificationRecord } from '../lib/data';

// ── Brand colors ──
const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';

const ROLE_LABELS: Record<RoleType, string> = {
  member: 'メンバー',
  leader: 'リーダー',
  board: '経営層',
  retired: '退職',
};

// ══════════════════════════════════════
// Confirmation Dialog
// ══════════════════════════════════════
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={styles.btnSecondary}>キャンセル</button>
          <button onClick={onConfirm} style={styles.btnDanger}>実行</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// User Management Tab
// ══════════════════════════════════════
function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [retiredProfiles, setRetiredProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [activeProfiles, allTeams] = await Promise.all([
        fetchProfiles(),
        fetchTeams(),
      ]);
      setProfiles(activeProfiles);
      setTeams(allTeams);

      // fetchProfiles filters out retired by default; we need a separate fetch
      // For retired users, we fetch all and filter client-side
      // Since the data layer filters retired, we work with what's available
      // In Supabase mode, we'd need a separate query; for now mark retired separately
      setRetiredProfiles([]);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = (profile: Profile, newRole: RoleType) => {
    if (newRole === profile.role) return;
    const label = ROLE_LABELS[newRole];
    setConfirmAction({
      message: `${profile.display_name} のロールを「${label}」に変更しますか？`,
      action: async () => {
        await updateProfile(profile.id, { role: newRole });
        if (newRole === 'retired') {
          setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
          setRetiredProfiles((prev) => [...prev, { ...profile, role: newRole }]);
        } else {
          setProfiles((prev) =>
            prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
          );
        }
      },
    });
  };

  const handleTeamChange = async (profile: Profile, teamId: number | null) => {
    try {
      await updateProfile(profile.id, { team_id: teamId });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, team_id: teamId } : p))
      );
    } catch {
      setError('チーム変更に失敗しました');
    }
  };

  const handleRestoreUser = (profile: Profile) => {
    setConfirmAction({
      message: `${profile.display_name} を復帰（メンバー）にしますか？`,
      action: async () => {
        await updateProfile(profile.id, { role: 'member' });
        setRetiredProfiles((prev) => prev.filter((p) => p.id !== profile.id));
        setProfiles((prev) => [...prev, { ...profile, role: 'member' }]);
      },
    });
  };

  const teamName = (teamId: number | null) =>
    teamId ? teams.find((t) => t.id === teamId)?.name ?? '不明' : '未所属';

  if (loading) return <div style={styles.loading}>読み込み中...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div>
      <h2 style={styles.sectionTitle}>ユーザー管理</h2>

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={async () => {
            await confirmAction.action();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>名前</th>
              <th style={styles.th}>メール</th>
              <th style={styles.th}>ロール</th>
              <th style={styles.th}>チーム</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}>{p.display_name}</td>
                <td style={styles.tdEmail}>{p.email}</td>
                <td style={styles.td}>
                  <select
                    value={p.role}
                    onChange={(e) => handleRoleChange(p, e.target.value as RoleType)}
                    style={styles.select}
                  >
                    <option value="member">メンバー</option>
                    <option value="leader">リーダー</option>
                    <option value="board">経営層</option>
                    <option value="retired">退職</option>
                  </select>
                </td>
                <td style={styles.td}>
                  <select
                    value={p.team_id ?? ''}
                    onChange={(e) =>
                      handleTeamChange(p, e.target.value ? Number(e.target.value) : null)
                    }
                    style={styles.select}
                  >
                    <option value="">未所属</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profiles.length === 0 && (
        <p style={styles.emptyMessage}>ユーザーがいません</p>
      )}

      {/* Retired users collapsed section */}
      {retiredProfiles.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowRetired(!showRetired)}
            style={styles.collapseToggle}
          >
            {showRetired ? '▼' : '▶'} 退職ユーザー ({retiredProfiles.length})
          </button>
          {showRetired && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>名前</th>
                    <th style={styles.th}>メール</th>
                    <th style={styles.th}>元チーム</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {retiredProfiles.map((p) => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>{p.display_name}</td>
                      <td style={styles.tdEmail}>{p.email}</td>
                      <td style={styles.td}>{teamName(p.team_id)}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleRestoreUser(p)}
                          style={styles.btnSmall}
                        >
                          復帰
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Team Management Tab
// ══════════════════════════════════════
function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [allTeams, allProfiles] = await Promise.all([
        fetchTeams(),
        fetchProfiles(),
      ]);
      setTeams(allTeams);
      setProfiles(allProfiles);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const membersOfTeam = (teamId: number) =>
    profiles.filter((p) => p.team_id === teamId);

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name) {
      setError('チーム名を入力してください');
      return;
    }
    if (teams.some((t) => t.name === name)) {
      setError('同じ名前のチームが既に存在します');
      return;
    }
    try {
      setError('');
      const created = await createTeam(name);
      setTeams((prev) => [...prev, created]);
      setNewTeamName('');
    } catch (err) {
      setError('チーム作成に失敗しました（Supabase接続が必要です）');
      console.error(err);
    }
  };

  const handleEditTeam = async (teamId: number) => {
    const name = editingName.trim();
    if (!name) {
      setError('チーム名を入力してください');
      return;
    }
    if (teams.some((t) => t.name === name && t.id !== teamId)) {
      setError('同じ名前のチームが既に存在します');
      return;
    }
    try {
      setError('');
      await updateTeam(teamId, name);
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name } : t)));
      setEditingTeamId(null);
      setEditingName('');
    } catch (err) {
      setError('チーム名の更新に失敗しました');
      console.error(err);
    }
  };

  const handleDeleteTeam = (team: Team) => {
    const members = membersOfTeam(team.id);
    if (members.length > 0) {
      setError(`「${team.name}」にはメンバーが${members.length}人所属しているため削除できません`);
      return;
    }
    setConfirmAction({
      message: `チーム「${team.name}」を削除しますか？`,
      action: async () => {
        await deleteTeam(team.id);
        setTeams((prev) => prev.filter((t) => t.id !== team.id));
      },
    });
  };

  const handleSetLeader = async (teamId: number, userId: string) => {
    try {
      setError('');
      // First, demote any existing leaders in this team to member
      const currentLeaders = profiles.filter(
        (p) => p.team_id === teamId && p.role === 'leader'
      );
      for (const leader of currentLeaders) {
        await updateProfile(leader.id, { role: 'member' });
      }
      // Promote the selected user
      if (userId) {
        await updateProfile(userId, { role: 'leader' });
      }
      // Reload profiles
      const updatedProfiles = await fetchProfiles();
      setProfiles(updatedProfiles);
    } catch (err) {
      setError('リーダー設定に失敗しました');
      console.error(err);
    }
  };

  if (loading) return <div style={styles.loading}>読み込み中...</div>;

  return (
    <div>
      <h2 style={styles.sectionTitle}>チーム管理</h2>

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={async () => {
            await confirmAction.action();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {error && <div style={styles.errorInline}>{error}</div>}

      {/* Create new team */}
      <div style={styles.createRow}>
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="新しいチーム名"
          style={styles.input}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
        />
        <button onClick={handleCreateTeam} style={styles.btnPrimary}>
          作成
        </button>
      </div>

      {/* Team list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {teams.map((team) => {
          const members = membersOfTeam(team.id);
          const currentLeader = members.find((m) => m.role === 'leader');
          const isEditing = editingTeamId === team.id;

          return (
            <div key={team.id} style={styles.teamCard}>
              <div style={styles.teamHeader}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={styles.input}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditTeam(team.id)}
                      autoFocus
                    />
                    <button onClick={() => handleEditTeam(team.id)} style={styles.btnSmall}>
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingTeamId(null);
                        setEditingName('');
                      }}
                      style={styles.btnSmallSecondary}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={styles.teamName}>{team.name}</span>
                      <span style={styles.memberCount}>{members.length}人</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          setEditingTeamId(team.id);
                          setEditingName(team.name);
                        }}
                        style={styles.btnSmall}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team)}
                        style={styles.btnSmallDanger}
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Leader selector */}
              <div style={styles.teamDetail}>
                <label style={styles.label}>リーダー:</label>
                <select
                  value={currentLeader?.id ?? ''}
                  onChange={(e) => handleSetLeader(team.id, e.target.value)}
                  style={styles.select}
                >
                  <option value="">未設定</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member list */}
              {members.length > 0 && (
                <div style={styles.memberList}>
                  {members.map((m) => (
                    <span key={m.id} style={styles.memberChip}>
                      {m.display_name}
                      {m.role === 'leader' && (
                        <span style={styles.leaderBadge}>L</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {teams.length === 0 && (
        <p style={styles.emptyMessage}>チームがありません</p>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Master Data Tab
// ══════════════════════════════════════
function MasterData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, l, s] = await Promise.all([
          fetchCourses(),
          fetchLevels(),
          fetchSkills(),
        ]);
        setCourses(c);
        setLevels(l);
        setSkills(s);
      } catch (err) {
        setError('マスタデータの取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={styles.loading}>読み込み中...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div>
      <h2 style={styles.sectionTitle}>マスタ管理</h2>
      <p style={styles.hint}>
        現在は閲覧のみです。編集機能は今後追加予定です。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {courses.map((course) => {
          const courseLevels = levels
            .filter((l) => l.course_id === course.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const isExpanded = expandedCourse === course.id;

          return (
            <div key={course.id} style={styles.treeNode}>
              <button
                onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                style={styles.treeToggle}
              >
                <span style={{ marginRight: 8 }}>{isExpanded ? '▼' : '▶'}</span>
                <span style={styles.courseLabel}>{course.name}</span>
                <span style={styles.courseType}>{course.type}</span>
              </button>

              {isExpanded && (
                <div style={styles.treeChildren}>
                  {courseLevels.map((level) => {
                    const levelSkills = skills
                      .filter((s) => s.level_id === level.id && s.course_id === course.id)
                      .sort((a, b) => a.no - b.no);
                    const isLevelExpanded = expandedLevel === level.id;

                    return (
                      <div key={level.id} style={styles.treeNode}>
                        <button
                          onClick={() =>
                            setExpandedLevel(isLevelExpanded ? null : level.id)
                          }
                          style={styles.treeToggle}
                        >
                          <span style={{ marginRight: 8 }}>
                            {isLevelExpanded ? '▼' : '▶'}
                          </span>
                          <span>{level.name}</span>
                          <span style={styles.kindBadge}>{level.kind}</span>
                          <span style={styles.skillCount}>
                            {levelSkills.length}スキル
                          </span>
                        </button>

                        {isLevelExpanded && (
                          <div style={styles.treeChildren}>
                            {levelSkills.map((skill) => (
                              <button
                                key={skill.id}
                                onClick={() =>
                                  setSelectedSkill(
                                    selectedSkill?.id === skill.id ? null : skill
                                  )
                                }
                                style={{
                                  ...styles.skillRow,
                                  background:
                                    selectedSkill?.id === skill.id
                                      ? '#e8f4fd'
                                      : 'transparent',
                                }}
                              >
                                <span style={styles.skillNo}>#{skill.no}</span>
                                <span style={styles.skillName}>{skill.name}</span>
                                <span style={styles.answerTypeBadge}>
                                  {skill.answer_type}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skill detail panel */}
      {selectedSkill && (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <h3 style={{ margin: 0, fontSize: 16, color: DEEP_BLUE }}>
              #{selectedSkill.no} {selectedSkill.name}
            </h3>
            <button
              onClick={() => setSelectedSkill(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>カテゴリ</span>
              <span>{selectedSkill.category}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>説明</span>
              <span>{selectedSkill.description || '---'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>ウェイト</span>
              <span>{selectedSkill.weight}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>重要度</span>
              <span>{selectedSkill.importance ?? '---'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>回答タイプ</span>
              <span>{selectedSkill.answer_type === 'scale5' ? '5段階' : '二択'}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>スコア除外</span>
              <span>{selectedSkill.score_excluded ? 'はい' : 'いいえ'}</span>
            </div>
            {selectedSkill.ref_note && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>参考メモ</span>
                <span>{selectedSkill.ref_note}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Invite Management Tab
// ══════════════════════════════════════
interface InviteRow {
  email: string;
  role: string;
  teamId: string;
}

const emptyRow = (): InviteRow => ({ email: '', role: 'member', teamId: '' });

function InviteManagement() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<InviteRow[]>([emptyRow()]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [inv, t] = await Promise.all([fetchInvitations(), fetchTeams()]);
      setInvitations(inv);
      setTeams(t);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateRow = (idx: number, field: keyof InviteRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows(prev => [...prev, emptyRow()]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const validRows = rows.filter(r => r.email.trim() && r.email.includes('@widsley.com'));

  const handleInvite = async () => {
    if (validRows.length === 0) {
      setFeedback('@widsley.com のアドレスを入力してください');
      return;
    }
    setSending(true);
    setFeedback('');
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const row of validRows) {
      try {
        await createInvitation(
          row.email.trim(),
          row.role,
          row.teamId ? Number(row.teamId) : null,
          user?.id ?? '',
        );
        const teamName = row.teamId ? teams.find(t => t.id === Number(row.teamId))?.name ?? '' : '';
        await sendInviteEmail(row.email.trim(), row.role, teamName);
        successCount++;
      } catch (err: unknown) {
        failCount++;
        const msg = err instanceof Error ? err.message : '';
        errors.push(`${row.email}: ${msg.includes('duplicate') ? '既に招待済み' : '登録失敗'}`);
      }
    }

    if (successCount > 0) {
      setRows([emptyRow()]);
    }
    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount}件の招待を送信しました`);
    if (failCount > 0) parts.push(`${failCount}件失敗: ${errors.join(', ')}`);
    setFeedback(parts.join('。'));
    await loadData();
    setSending(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この招待を取り消しますか？')) return;
    try {
      await deleteInvitation(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete invitation:', err);
    }
  };

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const acceptedInvitations = invitations.filter(i => i.status === 'accepted');

  if (loading) return <p style={{ color: '#999' }}>読み込み中...</p>;

  return (
    <div>
      {/* Invite form */}
      <div style={{
        background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 24,
        border: '1px solid #e5eef5',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: DEEP_BLUE, margin: '0 0 12px' }}>
          新規招待（最大10件）
        </h3>

        {/* Header row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '0 4px' }}>
          <div style={{ flex: '1 1 200px', fontSize: 11, fontWeight: 600, color: '#888' }}>メールアドレス</div>
          <div style={{ flex: '0 0 110px', fontSize: 11, fontWeight: 600, color: '#888' }}>ロール</div>
          <div style={{ flex: '0 0 140px', fontSize: 11, fontWeight: 600, color: '#888' }}>チーム</div>
          <div style={{ flex: '0 0 28px' }} />
        </div>

        {/* Input rows */}
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            <input
              type="email"
              value={row.email}
              onChange={e => updateRow(idx, 'email', e.target.value)}
              placeholder="name@widsley.com"
              style={{ ...inputStyle, flex: '1 1 200px' }}
            />
            <select value={row.role} onChange={e => updateRow(idx, 'role', e.target.value)} style={{ ...inputStyle, flex: '0 0 110px' }}>
              <option value="member">メンバー</option>
              <option value="leader">リーダー</option>
              <option value="board">管理者</option>
            </select>
            <select value={row.teamId} onChange={e => updateRow(idx, 'teamId', e.target.value)} style={{ ...inputStyle, flex: '0 0 140px' }}>
              <option value="">未割当</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button
              onClick={() => removeRow(idx)}
              disabled={rows.length <= 1}
              style={{
                flex: '0 0 28px', height: 28, fontSize: 16, color: rows.length <= 1 ? '#ddd' : '#e74c3c',
                background: 'none', border: 'none', cursor: rows.length <= 1 ? 'default' : 'pointer', padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add row + Submit */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
          {rows.length < 10 && (
            <button
              onClick={addRow}
              style={{
                padding: '6px 14px', fontSize: 13, fontWeight: 600, color: CYAN,
                background: `${CYAN}10`, border: `1px solid ${CYAN}30`, borderRadius: 8, cursor: 'pointer',
              }}
            >
              ＋ 行を追加
            </button>
          )}
          <button
            onClick={handleInvite}
            disabled={sending || validRows.length === 0}
            style={{
              padding: '8px 24px', fontSize: 14, fontWeight: 700, color: '#fff',
              background: sending || validRows.length === 0 ? '#ccc' : `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
              border: 'none', borderRadius: 8, cursor: sending || validRows.length === 0 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {sending ? '送信中...' : `${validRows.length}件を招待`}
          </button>
        </div>

        {feedback && (
          <div style={{
            marginTop: 10, fontSize: 13, fontWeight: 600,
            color: feedback.includes('失敗') || feedback.includes('既に') || feedback.includes('@') ? '#e74c3c' : SEA_GREEN,
          }}>
            {feedback}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: '#999', lineHeight: 1.5 }}>
          招待登録と同時に招待メールが自動送信されます。<br />
          ユーザーが初回Googleログイン時に自動的にロール・チームが設定されます。
        </div>
      </div>

      {/* Pending invitations */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: DEEP_BLUE, margin: '0 0 12px' }}>
        招待中（{pendingInvitations.length}件）
      </h3>
      {pendingInvitations.length === 0 ? (
        <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>なし</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={thSt}>メール</th>
                <th style={thSt}>ロール</th>
                <th style={thSt}>チーム</th>
                <th style={thSt}>登録日</th>
                <th style={thSt}>操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvitations.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={tdSt}>{inv.email}</td>
                  <td style={tdSt}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                      background: inv.role === 'board' ? `${MAGENTA}15` : inv.role === 'leader' ? `${CYAN}15` : '#f0f0f0',
                      color: inv.role === 'board' ? MAGENTA : inv.role === 'leader' ? CYAN : '#666',
                    }}>
                      {ROLE_LABELS[inv.role as RoleType] ?? inv.role}
                    </span>
                  </td>
                  <td style={tdSt}>{teams.find(t => t.id === inv.team_id)?.name ?? '未割当'}</td>
                  <td style={tdSt}>{new Date(inv.created_at).toLocaleDateString('ja-JP')}</td>
                  <td style={tdSt}>
                    <button onClick={() => handleDelete(inv.id)} style={{
                      fontSize: 11, color: '#e74c3c', background: '#ffeaea',
                      border: '1px solid #f5c6cb', borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                    }}>
                      取消
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Accepted invitations */}
      {acceptedInvitations.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: DEEP_BLUE, margin: '0 0 12px' }}>
            承認済み（{acceptedInvitations.length}件）
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={thSt}>メール</th>
                  <th style={thSt}>ロール</th>
                  <th style={thSt}>チーム</th>
                  <th style={thSt}>登録日</th>
                </tr>
              </thead>
              <tbody>
                {acceptedInvitations.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={tdSt}>{inv.email}</td>
                    <td style={tdSt}>{ROLE_LABELS[inv.role as RoleType] ?? inv.role}</td>
                    <td style={tdSt}>{teams.find(t => t.id === inv.team_id)?.name ?? '未割当'}</td>
                    <td style={tdSt}>{new Date(inv.created_at).toLocaleDateString('ja-JP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 8, background: '#fff' };
const thSt: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 700, color: '#8893A4' };
const tdSt: React.CSSProperties = { padding: '8px 10px', fontSize: 13, color: DEEP_BLUE };

// ══════════════════════════════════════
// Certification Management Tab
// ══════════════════════════════════════
const LEVEL_OPTIONS = [
  { value: 'academia', label: 'Academia' },
  { value: 'entry', label: 'Entry' },
  { value: 'associate', label: 'Associate' },
  { value: 'professional', label: 'Professional' },
  { value: 'expert', label: 'Expert' },
];
const CATEGORY_OPTIONS = ['国家資格', 'QA推奨', 'ベンダー系', 'ベンダーニュートラル系', 'AI系', '社内認定資格'];

function CertificationManagement() {
  const [certs, setCerts] = useState<CertificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [editingCert, setEditingCert] = useState<CertificationRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLevel, setFormLevel] = useState('entry');
  const [formCategory, setFormCategory] = useState('国家資格');
  const [formReward, setFormReward] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCertifications();
      setCerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew = () => {
    setIsNew(true);
    setEditingCert(null);
    setFormName('');
    setFormDesc('');
    setFormLevel('entry');
    setFormCategory('国家資格');
    setFormReward('');
    setFeedback('');
  };

  const openEdit = (cert: CertificationRecord) => {
    setIsNew(false);
    setEditingCert(cert);
    setFormName(cert.name);
    setFormDesc(cert.description);
    setFormLevel(cert.level);
    setFormCategory(cert.category);
    setFormReward(cert.reward ?? '');
    setFeedback('');
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFeedback('資格名を入力してください'); return; }
    setSaving(true);
    try {
      if (isNew) {
        await createCertification({
          name: formName.trim(),
          description: formDesc,
          level: formLevel,
          category: formCategory,
          reward: formReward || null,
          sort_order: certs.filter(c => c.level === formLevel).length + 1,
        });
        setFeedback('追加しました');
      } else if (editingCert) {
        await updateCertification(editingCert.id, {
          name: formName.trim(),
          description: formDesc,
          level: formLevel,
          category: formCategory,
          reward: formReward || null,
        });
        setFeedback('更新しました');
      }
      await loadData();
      setTimeout(() => { setEditingCert(null); setIsNew(false); }, 800);
    } catch (err) {
      setFeedback('保存に失敗しました');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cert: CertificationRecord) => {
    if (!confirm(`「${cert.name}」を削除しますか？`)) return;
    try {
      await deleteCertification(cert.id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました');
    }
  };

  const filteredCerts = filterLevel ? certs.filter(c => c.level === filterLevel) : certs;
  const grouped = LEVEL_OPTIONS.map(lo => ({
    ...lo,
    certs: filteredCerts.filter(c => c.level === lo.value),
  })).filter(g => g.certs.length > 0);

  if (loading) return <p style={{ color: '#999' }}>読み込み中...</p>;

  return (
    <div>
      {/* Header + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={inputStyle}>
            <option value="">全レベル</option>
            {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#888', alignSelf: 'center' }}>{filteredCerts.length}件</span>
        </div>
        <button onClick={openNew} style={{
          padding: '8px 18px', fontSize: 13, fontWeight: 700, color: '#fff',
          background: `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
          border: 'none', borderRadius: 8, cursor: 'pointer',
        }}>
          ＋ 資格を追加
        </button>
      </div>

      {/* Edit/New modal */}
      {(editingCert || isNew) && (
        <div style={{
          background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 20,
          border: `1px solid ${CYAN}30`,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: DEEP_BLUE, margin: '0 0 12px' }}>
            {isNew ? '新規資格' : `編集: ${editingCert?.name}`}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>資格名</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} style={inputStyle} placeholder="資格名" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>説明</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="資格の説明（任意）" />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>レベル</label>
                <select value={formLevel} onChange={e => setFormLevel(e.target.value)} style={inputStyle}>
                  {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>カテゴリ</label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)} style={inputStyle}>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>報奨金情報</label>
                <input value={formReward} onChange={e => setFormReward(e.target.value)} style={inputStyle} placeholder="例: 報奨金10,000円" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff',
              background: saving ? '#ccc' : `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
              border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer',
            }}>
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => { setEditingCert(null); setIsNew(false); }} style={{
              padding: '8px 16px', fontSize: 13, color: '#666', background: '#f0f0f0',
              border: 'none', borderRadius: 8, cursor: 'pointer',
            }}>
              キャンセル
            </button>
            {feedback && <span style={{ fontSize: 13, fontWeight: 600, color: feedback.includes('失敗') ? '#e74c3c' : SEA_GREEN }}>{feedback}</span>}
          </div>
        </div>
      )}

      {/* Cert list grouped by level */}
      {grouped.map(g => (
        <div key={g.value} style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: DEEP_BLUE, margin: '0 0 8px' }}>{g.label}（{g.certs.length}件）</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {g.certs.map(cert => (
              <div key={cert.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #eee', gap: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DEEP_BLUE }}>{cert.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {cert.category}
                    {cert.description && ` — ${cert.description.slice(0, 40)}${cert.description.length > 40 ? '...' : ''}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(cert)} style={{
                    fontSize: 11, color: CYAN, background: `${CYAN}10`, border: `1px solid ${CYAN}30`,
                    borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                  }}>編集</button>
                  <button onClick={() => handleDelete(cert)} style={{
                    fontSize: 11, color: '#e74c3c', background: '#ffeaea', border: '1px solid #f5c6cb',
                    borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                  }}>削除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════
// AdminPanel (root)
// ══════════════════════════════════════
export default function AdminPanel() {
  const location = useLocation();

  const tabs = [
    { path: '/admin/invite', label: '招待' },
    { path: '/admin/users', label: 'ユーザー管理' },
    { path: '/admin/teams', label: 'チーム管理' },
    { path: '/admin/certs', label: '資格管理' },
    { path: '/admin/master', label: 'マスタ管理' },
  ];

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? '/admin/users';

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>管理パネル</h1>

        {/* Tab navigation */}
        <nav style={styles.tabBar}>
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                ...styles.tab,
                ...(activeTab === tab.path ? styles.tabActive : {}),
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Tab content */}
        <div style={styles.tabContent}>
          <Routes>
            <Route path="invite" element={<InviteManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="teams" element={<TeamManagement />} />
            <Route path="certs" element={<CertificationManagement />} />
            <Route path="master" element={<MasterData />} />
            <Route path="" element={<Navigate to="/admin/invite" replace />} />
            <Route path="*" element={<Navigate to="/admin/invite" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// Styles
// ══════════════════════════════════════
const styles: Record<string, React.CSSProperties> = {
  // Layout
  container: {
    minHeight: 'calc(100vh - 64px)',
    background: '#f5f7fa',
    padding: '24px 16px',
  },
  content: {
    maxWidth: 1000,
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: '0 0 20px',
  },

  // Tabs
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: `2px solid #e0e0e0`,
    marginBottom: 24,
    overflowX: 'auto',
  },
  tab: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: '#666',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -2,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: CYAN,
    borderBottomColor: CYAN,
  },
  tabContent: {
    background: '#fff',
    borderRadius: 10,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: DEEP_BLUE,
    margin: '0 0 16px',
  },

  // Table
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontWeight: 700,
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    borderBottom: '2px solid #eee',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle',
  },
  tdEmail: {
    padding: '10px 12px',
    verticalAlign: 'middle',
    fontSize: 13,
    color: '#666',
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Form elements
  select: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 13,
    background: '#fff',
    cursor: 'pointer',
    minWidth: 100,
  },
  input: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
    whiteSpace: 'nowrap',
  },

  // Buttons
  btnPrimary: {
    padding: '8px 20px',
    borderRadius: 6,
    border: 'none',
    background: CYAN,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnSecondary: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#fff',
    color: '#333',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: MAGENTA,
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnSmall: {
    padding: '4px 12px',
    borderRadius: 5,
    border: 'none',
    background: CYAN,
    color: '#fff',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
  btnSmallSecondary: {
    padding: '4px 12px',
    borderRadius: 5,
    border: '1px solid #ddd',
    background: '#fff',
    color: '#666',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
  btnSmallDanger: {
    padding: '4px 12px',
    borderRadius: 5,
    border: 'none',
    background: MAGENTA,
    color: '#fff',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },

  // Collapse toggle
  collapseToggle: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#666',
    cursor: 'pointer',
    padding: '8px 0',
  },

  // Create row
  createRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 8,
  },

  // Team card
  teamCard: {
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    padding: 16,
    background: '#fafbfc',
  },
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 700,
    color: DEEP_BLUE,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: 600,
    color: CYAN,
    background: '#e8f4fd',
    padding: '2px 8px',
    borderRadius: 10,
  },
  teamDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  memberList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  memberChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    padding: '4px 10px',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 16,
  },
  leaderBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    background: SEA_GREEN,
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
  },

  // Tree (master data)
  treeNode: {
    borderLeft: '2px solid #e8e8e8',
  },
  treeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left',
    color: DEEP_BLUE,
    fontWeight: 600,
  },
  treeChildren: {
    paddingLeft: 20,
  },
  courseLabel: {
    fontWeight: 700,
  },
  courseType: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    background: SEA_GREEN,
    padding: '1px 8px',
    borderRadius: 8,
    marginLeft: 8,
  },
  kindBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: CYAN,
    background: '#e8f4fd',
    padding: '1px 6px',
    borderRadius: 6,
    marginLeft: 6,
  },
  skillCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  skillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    borderRadius: 4,
    transition: 'background 0.1s',
  },
  skillNo: {
    fontSize: 12,
    color: '#999',
    fontWeight: 600,
    minWidth: 32,
  },
  skillName: {
    flex: 1,
    color: DEEP_BLUE,
  },
  answerTypeBadge: {
    fontSize: 11,
    color: '#888',
    background: '#f0f0f0',
    padding: '1px 6px',
    borderRadius: 4,
  },

  // Detail panel
  detailPanel: {
    marginTop: 20,
    padding: 20,
    background: '#f8fbfd',
    borderRadius: 10,
    border: `1px solid ${CYAN}33`,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    color: '#999',
    cursor: 'pointer',
    padding: 4,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 12,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#888',
    textTransform: 'uppercase',
  },

  // Dialog
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },

  // States
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#888',
    fontSize: 15,
  },
  error: {
    textAlign: 'center',
    padding: 40,
    color: MAGENTA,
    fontSize: 15,
  },
  errorInline: {
    padding: '10px 14px',
    borderRadius: 8,
    background: '#fef2f6',
    color: MAGENTA,
    fontSize: 13,
    marginBottom: 12,
  },
  emptyMessage: {
    textAlign: 'center',
    padding: 24,
    color: '#aaa',
    fontSize: 14,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    fontStyle: 'italic',
  },
};
