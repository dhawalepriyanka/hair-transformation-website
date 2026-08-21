import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/api';
import { ShieldCheck, Lock, User, AlertCircle, Scissors } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginAdmin({ username, password });
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid #EBE5E0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#F7EFEA',
              color: '#C88A75',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <Scissors size={28} />
          </div>
          <h2 className="serif" style={{ fontSize: '1.8rem', color: '#1E1E1E' }}>
            Hair Style Admin Portal
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Dipali Wakale Hair Style Management Login
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FFEBEE',
              color: '#C62828',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #CCC',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #CCC',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#C88A75',
              color: '#FFF',
              padding: '0.85rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
