import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginAdmin } from '../../services/api';
import { setAdminSession } from '../../services/adminSession';
import { AlertCircle, Lock, ShieldCheck, User, UserRoundCheck } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

const AdminLogin = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('receptionist');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('expired') ? 'Your session expired. Please sign in again.' : '');
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const data = await loginAdmin({ username, password, role });
      setAdminSession({ token: data.token, user: data.user, expiresAt: data.expiresAt });
      navigate(data.user.role === 'admin' ? '/admin/patients' : '/receptionist');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return <section className="staff-login-page">
    <div className="staff-login-card">
      <div className="login-brand"><BrandLogo showText={false} className="login-logo"/><h1 className="serif">Staff Portal</h1><p>Dipali Wakale · Hair &amp; Skin Care</p></div>
      <div className="role-picker" aria-label="Choose staff role">
        <button type="button" className={role === 'receptionist' ? 'selected' : ''} onClick={() => { setRole('receptionist'); setError(''); }}><UserRoundCheck /> <strong>Receptionist</strong><small>Patient registration</small></button>
        <button type="button" className={role === 'admin' ? 'selected' : ''} onClick={() => { setRole('admin'); setError(''); }}><ShieldCheck /> <strong>Admin</strong><small>Clinic management</small></button>
      </div>
      {error && <div className="form-alert"><AlertCircle size={17} /> {error}</div>}
      <form onSubmit={submit} className="clinic-form">
        <label>Username<div className="icon-input"><User size={17} /><input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} /></div></label>
        <label>Password<div className="icon-input"><Lock size={17} /><input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></div></label>
        <button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : `Sign in as ${role === 'admin' ? 'Admin' : 'Receptionist'}`}</button>
      </form>
    </div>
  </section>;
};

export default AdminLogin;
