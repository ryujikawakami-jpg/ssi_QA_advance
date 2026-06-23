import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCertifications,
  fetchUserCertifications,
  upsertUserCertification,
  removeUserCertification,
} from '../lib/data';
import type { CertificationRecord, UserCertification } from '../lib/data';

const DEEP_BLUE = '#03202F';
const CYAN = '#3DB7E4';
const SEA_GREEN = '#50DAB0';
const MAGENTA = '#E21776';

const levelColors: Record<string, string> = {
  'Academia': '#6B7280',
  'エントリー': CYAN,
  'アソシエイト': SEA_GREEN,
  'プロフェッショナル': MAGENTA,
  'エキスパート': '#8B5CF6',
};

const categoryColors: Record<string, string> = {
  '国家資格': '#dc2626',
  'QA推奨': SEA_GREEN,
  'ベンダー系': CYAN,
  'ベンダーニュートラル系': '#8B5CF6',
  'AI系': '#F59E0B',
  '社内認定資格': MAGENTA,
};

function statusIndicator(status: string | undefined): string {
  if (status === 'interested') return ' \u2665';
  if (status === 'studying') return ' \u2605';
  if (status === 'acquired') return ' \u2713';
  return '';
}

export default function CertificationPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<CertificationRecord[]>([]);
  const [userCerts, setUserCerts] = useState<UserCertification[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [modalCert, setModalCert] = useState<CertificationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [allCerts, uc] = await Promise.all([
        fetchCertifications(),
        user ? fetchUserCertifications(user.id) : Promise.resolve([]),
      ]);
      setCerts(allCerts);
      setUserCerts(uc);
    } catch (e) {
      console.error('Failed to load certifications:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getUserCertStatus = (certId: number): string | undefined => {
    return userCerts.find(uc => uc.certification_id === certId)?.status;
  };

  const handleToggleInterested = async (certId: number) => {
    if (!user) return;
    const current = getUserCertStatus(certId);
    if (!current) {
      await upsertUserCertification(user.id, certId, 'interested');
    } else if (current === 'interested') {
      await removeUserCertification(user.id, certId);
    }
    await loadData();
  };

  // Group certs by level
  const levelNames = [...new Set(certs.map(c => c.level))];
  const levelGroups = levelNames.map(level => ({
    level,
    color: levelColors[level] ?? '#666',
    reward: certs.find(c => c.level === level)?.reward ?? '',
    certs: certs.filter(c => c.level === level),
  }));

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#999' }}>読み込み中...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', padding: '24px 16px 60px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: DEEP_BLUE, marginBottom: 8 }}>奨励資格一覧</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
        SSI事業部で推奨される資格の一覧です。レベルに応じた報奨金制度があります。
      </p>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={() => setSelectedLevel(null)}
          style={{
            padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 999, cursor: 'pointer',
            border: selectedLevel === null ? 'none' : '1px solid #ddd',
            background: selectedLevel === null ? DEEP_BLUE : '#fff',
            color: selectedLevel === null ? '#fff' : '#666',
          }}
        >
          すべて
        </button>
        {levelGroups.map(lv => (
          <button
            key={lv.level}
            onClick={() => setSelectedLevel(lv.level)}
            style={{
              padding: '6px 16px', fontSize: 13, fontWeight: 600, borderRadius: 999, cursor: 'pointer',
              border: selectedLevel === lv.level ? 'none' : `1px solid ${lv.color}40`,
              background: selectedLevel === lv.level ? lv.color : '#fff',
              color: selectedLevel === lv.level ? '#fff' : lv.color,
            }}
          >
            {lv.level}
          </button>
        ))}
      </div>

      {/* Level sections */}
      {levelGroups
        .filter(lv => !selectedLevel || lv.level === selectedLevel)
        .map(lv => {
          const categories = [...new Set(lv.certs.map(c => c.category))];
          return (
            <div key={lv.level} style={{
              background: '#fff', borderRadius: 16, padding: '24px', marginBottom: 20,
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)', border: `1px solid ${lv.color}20`,
            }}>
              {/* Level header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 16, fontWeight: 800, color: '#fff', background: lv.color,
                  padding: '5px 16px', borderRadius: 999,
                }}>
                  {lv.level}
                </span>
                <span style={{ fontSize: 13, color: lv.color, fontWeight: 700 }}>
                  {lv.reward}
                </span>
                <span style={{ fontSize: 12, color: '#aaa' }}>
                  {lv.certs.length}資格
                </span>
              </div>

              {/* Certs grouped by category */}
              {categories.map(cat => {
                const catCerts = lv.certs.filter(c => c.category === cat);
                return (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: categoryColors[cat] ?? '#666',
                      marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: categoryColors[cat] ?? '#999', display: 'inline-block',
                      }} />
                      {cat}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 14 }}>
                      {catCerts.map(cert => {
                        const status = getUserCertStatus(cert.id);
                        const indicator = statusIndicator(status);
                        return (
                          <button
                            key={cert.id}
                            onClick={() => setModalCert(cert)}
                            style={{
                              fontSize: 13, color: DEEP_BLUE, background: status ? '#eef8ff' : '#f5f7fa',
                              padding: '5px 12px', borderRadius: 8,
                              border: status ? `1px solid ${CYAN}60` : '1px solid #eee',
                              lineHeight: 1.4, cursor: 'pointer',
                              fontWeight: status ? 600 : 400,
                            }}
                          >
                            {cert.name}{indicator}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

      {/* Modal */}
      {modalCert && (
        <div
          onClick={() => setModalCert(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DEEP_BLUE, marginBottom: 12 }}>
              {modalCert.name}
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                background: levelColors[modalCert.level] ?? '#666',
                padding: '3px 10px', borderRadius: 999,
              }}>
                {modalCert.level}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: categoryColors[modalCert.category] ?? '#666',
                background: `${categoryColors[modalCert.category] ?? '#666'}18`,
                padding: '3px 10px', borderRadius: 999,
                border: `1px solid ${categoryColors[modalCert.category] ?? '#666'}40`,
              }}>
                {modalCert.category}
              </span>
            </div>

            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>
              {modalCert.description || '説明はまだありません'}
            </p>

            {modalCert.reward && (
              <div style={{
                fontSize: 13, color: levelColors[modalCert.level] ?? '#666',
                fontWeight: 700, marginBottom: 20,
                padding: '8px 12px', borderRadius: 8,
                background: `${levelColors[modalCert.level] ?? '#666'}10`,
              }}>
                {modalCert.reward}
              </div>
            )}

            {/* Status / action buttons */}
            {(() => {
              const status = getUserCertStatus(modalCert.id);
              if (status === 'acquired') {
                return (
                  <div style={{
                    padding: '10px 16px', borderRadius: 8, background: '#ecfdf5',
                    color: SEA_GREEN, fontWeight: 700, fontSize: 14, textAlign: 'center',
                  }}>
                    取得済み
                  </div>
                );
              }
              if (status === 'studying') {
                return (
                  <div style={{
                    padding: '10px 16px', borderRadius: 8, background: '#eff6ff',
                    color: CYAN, fontWeight: 700, fontSize: 14, textAlign: 'center',
                  }}>
                    習得を目指しています
                  </div>
                );
              }
              if (status === 'interested') {
                return (
                  <button
                    onClick={() => handleToggleInterested(modalCert.id)}
                    style={{
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: '#fff', border: `1px solid #ddd`, color: '#888',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    気になるを解除
                  </button>
                );
              }
              return (
                <button
                  onClick={() => handleToggleInterested(modalCert.id)}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8,
                    background: MAGENTA, border: 'none', color: '#fff',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  気になる
                </button>
              );
            })()}

            <button
              onClick={() => setModalCert(null)}
              style={{
                width: '100%', marginTop: 10, padding: '8px 16px', borderRadius: 8,
                background: '#f5f5f5', border: 'none', color: '#888',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
