import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../state/AdminContext';
import './admin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { adminLogin, isAdmin } = useAdmin();
  const navigate = useNavigate();

  if (isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminLogin(password);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Incorrect admin passcode. (Default: chandani2026)');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div
        className="admin-card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7952eb',
              fontWeight: 800,
              fontSize: '1.6rem',
              fontFamily: 'serif',
              margin: '0 auto 16px',
            }}
          >
            चाँ
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Chandani Atelier Portal
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '6px' }}>
            Storefront & Catalogue Control Center
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: '18px' }}>
            <label className="admin-label">Admin Passcode</label>
            <input
              type="password"
              className="admin-input"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
              Default passcode: <code style={{ color: '#7952eb' }}>chandani2026</code>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            Access Atelier Dashboard →
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <Link to="/" style={{ color: '#64748b', fontSize: '0.82rem', textDecoration: 'none' }}>
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
