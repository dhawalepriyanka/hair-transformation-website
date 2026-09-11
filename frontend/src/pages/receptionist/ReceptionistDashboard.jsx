import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CalendarDays, CalendarPlus, Clock3, Phone, Search, Stethoscope, Users } from 'lucide-react';
import { createPatientVisit, fetchPatientVisits, updatePatientVisit } from '../../services/api';
import { useStaffSession } from '../../services/adminSession';
import PatientRegistrationFields, { emptyPatientForm } from '../../components/PatientRegistrationFields';

const blank = emptyPatientForm();

export default function ReceptionistDashboard() {
  const session = useStaffSession();
  const location = useLocation();
  const patientFormRef = useRef(null);
  const [form, setForm] = useState(blank); const [visits, setVisits] = useState([]); const [query, setQuery] = useState('');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const load = () => fetchPatientVisits().then(setVisits).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (location.pathname === '/receptionist/add-patient') {
      patientFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      patientFormRef.current?.querySelector('input')?.focus({ preventScroll: true });
    }
  }, [location.pathname]);
  const filtered = useMemo(() => visits.filter(v => `${v.patient_name} ${v.mobile} ${v.visit_at}`.toLowerCase().includes(query.toLowerCase())), [visits, query]);
  if (!session || session.user?.role !== 'receptionist') return <Navigate to="/admin/login" replace />;
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => { e.preventDefault(); setSaving(true); setError(''); setMessage(''); try { await createPatientVisit(form); setForm(blank); setMessage('Patient visit registered successfully.'); load(); } catch (err) { setError(err.response?.data?.message || err.message); } finally { setSaving(false); } };
  const setStatus = async (visit, status) => { await updatePatientVisit(visit.id, { ...visit, status }); load(); };
  const sendToAdmin = async (visit) => {
    setError('');
    try { await updatePatientVisit(visit.id, { ...visit, status: 'In Consultation', sent_to_admin: true }); setMessage(`${visit.patient_name} was sent to the Admin dashboard.`); load(); }
    catch (err) { setError(err.response?.data?.message || err.message); }
  };
  return <section className="clinic-page receptionist-page"><div className="container">
    <header className="clinic-heading"><CalendarPlus /><div><h1 className="serif">Receptionist Dashboard</h1><p>Register patient visits and manage today’s queue.</p></div></header>
    <div className="clinic-layout">
      <form id="patient-form" ref={patientFormRef} className="clinic-panel clinic-form" onSubmit={submit}><h2 className="serif">Add Patient Visit</h2>
        {message && <div className="form-success">{message}</div>}{error && <div className="form-alert">{error}</div>}
        <PatientRegistrationFields form={form} onChange={change} />
        <button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Register Patient Visit'}</button>
      </form>
      <div className="clinic-panel visits-panel">
        <div className="visits-panel-heading"><div><h2 className="serif"><Users size={21} /> My Patient Visits</h2><p>Patients registered by you</p></div><span className="visit-count">{filtered.length}</span></div>
        <div className="visit-search"><Search size={18}/><input aria-label="Search patient visits" placeholder="Search by name, mobile number or date…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</div>
        <div className="patient-list visit-card-list">{filtered.length ? filtered.map(v => {
          const visitDate = new Date(v.visit_at);
          const initials = v.patient_name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
          return <article className="visit-card" key={v.id}>
            <div className="visit-card-top"><div className="patient-avatar">{initials}</div><div className="patient-summary"><strong>{v.patient_name}</strong><span><Phone size={14}/>{v.mobile}</span></div><span className={`visit-status status-${v.status.toLowerCase().replaceAll(' ', '-')}`}>{v.status}</span></div>
            <div className="visit-meta"><span><CalendarDays size={15}/>{visitDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span><span><Clock3 size={15}/>{visitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="visit-concern"><Stethoscope size={16}/><div><small>Main concern</small><p>{v.concern || 'Not provided'}</p></div></div>
            <div className="visit-card-actions"><label className="visit-status-control">Visit status<select value={v.status} onChange={e => setStatus(v, e.target.value)}>{['Waiting','In Consultation','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}</select></label>{v.sent_to_admin ? <span className="sent-confirmation">✓ Sent to Admin</span> : <button type="button" className="send-admin-button" onClick={() => sendToAdmin(v)}>Send to Admin</button>}</div>
          </article>;
        }) : <div className="visits-empty"><Users size={34}/><strong>No patient visits found</strong><p>{query ? 'Try a different name, mobile number or date.' : 'Newly registered patients will appear here.'}</p></div>}</div>
      </div>
    </div>
  </div></section>;
}
