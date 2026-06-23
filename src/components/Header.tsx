import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const LIGHT_BG = '#e0f0f8';

const roleLabelMap: Record<string, string> = {
  member: 'メンバー',
  leader: 'リーダー',
  board: '管理者',
  retired: '退職者',
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navItems = (
    <>
      <Link to="/mypage" style={styles.navLink}>マイページ</Link>
      <Link to="/" style={styles.navLink}>コース一覧</Link>
      <Link to="/certifications" style={styles.navLink}>資格表</Link>
      <Link to="/career" style={styles.navLink}>キャリアマップ</Link>
      {(user.role === 'leader' || user.role === 'board') && (
        <Link to="/team" style={styles.navLink}>チーム</Link>
      )}
      {user.role === 'board' && (
        <>
          <Link to="/board" style={styles.navLink}>全社</Link>
          <Link to="/admin" style={styles.navLink}>管理</Link>
        </>
      )}
    </>
  );

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon} />
          Widsley SkillCheck
        </Link>

        {/* Desktop nav */}
        <nav style={styles.desktopNav}>{navItems}</nav>

        {/* User area */}
        <div style={styles.userArea}>
          <span style={styles.userName}>{user.display_name}</span>
          <span style={styles.roleBadge}>{roleLabelMap[user.role] ?? user.role}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>ログアウト</button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={styles.hamburger}
          aria-label="メニュー"
        >
          <span style={{ fontSize: 24 }}>{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div id="mobile-menu" style={styles.mobileNav} onClick={() => setMenuOpen(false)}>
          {navItems}
          <div style={{ padding: '8px 16px', borderTop: '1px solid #eee', marginTop: 8 }}>
            <span style={styles.userName}>{user.display_name}</span>
            <span style={styles.roleBadge}>{roleLabelMap[user.role] ?? user.role}</span>
            <button onClick={handleLogout} style={{ ...styles.logoutBtn, marginLeft: 12 }}>ログアウト</button>
          </div>
        </div>
      )}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: '#fff',
    borderBottom: `3px solid ${CYAN}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 16px',
    height: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 17,
    fontWeight: 800,
    color: DEEP_BLUE,
    textDecoration: 'none',
    letterSpacing: '-0.3px',
  },
  logoIcon: {
    display: 'inline-block',
    width: 26,
    height: 26,
    borderRadius: 7,
    background: `linear-gradient(135deg, ${SEA_GREEN}, ${CYAN})`,
  },
  desktopNav: {
    display: 'flex',
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    textDecoration: 'none',
    color: DEEP_BLUE,
    fontWeight: 600,
    fontSize: 14,
    padding: '4px 12px',
    borderRadius: 6,
    transition: 'background 0.15s',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: DEEP_BLUE,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: 700,
    background: LIGHT_BG,
    color: CYAN,
    padding: '2px 8px',
    borderRadius: 10,
  },
  logoutBtn: {
    fontSize: 13,
    color: '#666',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  mobileNav: {
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    borderBottom: '1px solid #eee',
    padding: '8px 0',
    gap: 4,
  },
};

const styleSheet = typeof document !== 'undefined' && (() => {
  const s = document.createElement('style');
  s.textContent = `
    @media (max-width: 768px) {
      header nav[style] { display: none !important; }
      header button[aria-label="メニュー"] { display: block !important; }
      header > div > div:nth-child(3) { display: none !important; }
      #mobile-menu { display: flex !important; flex-direction: column; }
      #mobile-menu a { padding: 10px 20px !important; font-size: 15px !important; }
    }
    @media (min-width: 769px) {
      header button[aria-label="メニュー"] { display: none !important; }
      #mobile-menu { display: none !important; }
    }
    header a[style]:hover { background: ${LIGHT_BG}; }
  `;
  document.head.appendChild(s);
  return s;
})();
void styleSheet;
