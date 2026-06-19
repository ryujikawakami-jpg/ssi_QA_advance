import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profiles, teams } from '../data/mockData';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';

const roleLabelMap: Record<string, string> = {
  member: 'メンバー',
  leader: 'リーダー',
  board: '経営層',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>('');

  const handleLogin = () => {
    if (!selectedId) return;
    login(selectedId);
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoIcon} />
        <h1 style={styles.logo}>Widsley SkillCheck</h1>
        <p style={styles.subtitle}>スキルチェックアプリ</p>

        <div style={styles.selectWrapper}>
          <label style={styles.label}>ログインするユーザーを選択</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={styles.select}
          >
            <option value="">-- ユーザーを選択 --</option>
            {profiles.map((p) => {
              const team = teams.find((t) => t.id === p.team_id);
              return (
                <option key={p.id} value={p.id}>
                  {p.display_name} ({roleLabelMap[p.role]} / {team?.name})
                </option>
              );
            })}
          </select>
        </div>

        {selectedId && (
          <div style={styles.preview}>
            {(() => {
              const p = profiles.find((u) => u.id === selectedId)!;
              const team = teams.find((t) => t.id === p.team_id);
              return (
                <>
                  <div style={styles.previewName}>{p.display_name}</div>
                  <div style={styles.previewDetail}>
                    <span style={styles.roleBadge}>{roleLabelMap[p.role]}</span>
                    <span>{team?.name}</span>
                    <span style={{ color: '#999' }}>{p.email}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={!selectedId}
          style={{
            ...styles.googleBtn,
            opacity: selectedId ? 1 : 0.5,
            cursor: selectedId ? 'pointer' : 'not-allowed',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 10, flexShrink: 0 }}>
            <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4" />
            <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.71.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853" />
            <path d="M4.51 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83A8 8 0 0 0 .98 9c0 1.29.31 2.51.85 3.59l2.68-2.07z" fill="#FBBC05" />
            <path d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4l2.68 2.07c.63-1.88 2.4-3.29 4.47-3.29z" fill="#EA4335" />
          </svg>
          Googleでログイン
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${SEA_GREEN}20, ${CYAN}20, #fff)`,
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '48px 40px',
    maxWidth: 420,
    width: '100%',
    boxShadow: `0 4px 24px ${CYAN}18`,
    textAlign: 'center' as const,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
    margin: '0 auto 16px',
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: DEEP_BLUE,
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    margin: '0 0 32px',
  },
  selectWrapper: {
    textAlign: 'left' as const,
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fafafa',
    outline: 'none',
  },
  preview: {
    background: `${CYAN}12`,
    border: `1px solid ${CYAN}30`,
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 24,
    textAlign: 'left' as const,
  },
  previewName: {
    fontWeight: 700,
    fontSize: 16,
    color: DEEP_BLUE,
    marginBottom: 4,
  },
  previewDetail: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    fontSize: 13,
    color: '#666',
    flexWrap: 'wrap' as const,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: 700,
    background: CYAN,
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 10,
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 16px',
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 8,
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.15s',
  },
};
