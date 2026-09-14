import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Check, ChevronRight, Clock3, FileText, Phone, Plus, Search, Stethoscope, Trash2, UserRoundCheck, UsersRound } from 'lucide-react';
import { createPatientVisit, fetchPatientVisits, fetchProducts, updatePatientVisit } from '../../services/api';
import { useStaffSession } from '../../services/adminSession';
import PatientRegistrationFields, { emptyPatientForm } from '../../components/PatientRegistrationFields';
import Toast from '../../components/Toast';

const statuses = ['Active', 'Waiting', 'In Consultation', 'Completed', 'Cancelled'];
const isActiveVisit = visit => !['Completed', 'Cancelled'].includes(visit.status);

export default function AdminPatients() {
  const session = useStaffSession();
  const location = useLocation();
  const [showRegistration, setShowRegistration] = useState(false);
  const [form, setForm] = useState(emptyPatientForm);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const navigate = useNavigate(); const productSectionRef = useRef(null);
  const [visits, setVisits] = useState([]); const [query, setQuery] = useState(''); const [status, setStatus] = useState('Active'); const [date, setDate] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [products,setProducts]=useState([]); const [activeVisit,setActiveVisit]=useState(null); const [productQuery,setProductQuery]=useState(''); const [productCategory,setProductCategory]=useState('All'); const [saving,setSaving]=useState(false);
  useEffect(() => { Promise.all([fetchPatientVisits(),fetchProducts()]).then(([patientData,productData])=>{setVisits(patientData);setProducts(productData);const nextActive=patientData.find(isActiveVisit);if(nextActive)setActiveVisit(nextActive);}).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { setShowRegistration(location.pathname === '/admin/add-patient'); }, [location.pathname]);
  const filtered = useMemo(() => visits.filter(v => `${v.patient_name} ${v.mobile} ${v.concern}`.toLowerCase().includes(query.toLowerCase()) && (status === 'Active' ? isActiveVisit(v) : v.status === status) && (!date || String(v.visit_at).slice(0, 10) === date)), [visits, query, status, date]);
  const activeCount = visits.filter(isActiveVisit).length;
  const todayCount = visits.filter(v => isActiveVisit(v) && new Date(v.visit_at).toDateString() === new Date().toDateString()).length;
  const consultationCount = visits.filter(v => v.status === 'In Consultation').length;
  const visibleProducts=useMemo(()=>products.filter(p=>(productCategory==='All'||p.category===productCategory)&&`${p.name} ${p.product_code}`.toLowerCase().includes(productQuery.toLowerCase())),[products,productQuery,productCategory]);
  if (!session || session.user?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  const registerPatient = async event => {
    event.preventDefault(); setRegistering(true); setRegistrationError(''); setRegistrationMessage('');
    try {
      const created = await createPatientVisit(form);
      setVisits(list => [created, ...list]); setForm(emptyPatientForm());
      setRegistrationMessage('Patient registered and added to the clinic queue.');
    } catch (e) { setRegistrationError(e.response?.data?.message || e.message); }
    finally { setRegistering(false); }
  };
  const choosePatient=v=>{setActiveVisit({...v,recommendations:[...(v.recommendations||[])]});setTimeout(()=>productSectionRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),0);};
  const toggleProduct=p=>{const selected=activeVisit.recommendations.some(r=>r.product_id===p.id);setActiveVisit({...activeVisit,recommendations:selected?activeVisit.recommendations.filter(r=>r.product_id!==p.id):[...activeVisit.recommendations,{product_id:p.id,name:p.name,product_code:p.product_code,category:p.category,image_url:p.image_url,price:p.price,quantity:1,instructions:'',frequency:'',duration:'',timing:'',food_timing:'',additional_instructions:''}]});};
  const updateRecommendation=(index,field,value)=>setActiveVisit({...activeVisit,recommendations:activeVisit.recommendations.map((r,i)=>i===index?{...r,[field]:value}:r)});
  const removeProduct=index=>{if(window.confirm(`Remove ${activeVisit.recommendations[index].name}?`))setActiveVisit({...activeVisit,recommendations:activeVisit.recommendations.filter((_,i)=>i!==index)});};
  const saveAndPrint=async()=>{if(!activeVisit.recommendations.length){setError('Select at least one product before continuing.');return;}setSaving(true);setError('');try{const saved=await updatePatientVisit(activeVisit.id,activeVisit);setVisits(list=>list.map(v=>v.id===saved.id?saved:v));navigate(`/admin/patients/${activeVisit.id}/print`);}catch(e){setError(e.response?.data?.message||e.message);}finally{setSaving(false);}};

  return <section className="admin-patients-page"><div className="container">
    <Toast message={registrationError || error || registrationMessage || location.state?.completionMessage} type={registrationError || error ? 'error' : 'success'} onClose={() => { setRegistrationError(''); setRegistrationMessage(''); setError(''); if(location.state?.completionMessage)navigate(location.pathname,{replace:true,state:null}); }} />
    <header className="admin-patient-header"><div><span className="eyebrow">CLINIC WORKSPACE</span><h1 className="serif">Today’s Patients</h1><p>Active patients handed over by reception or registered by Admin.</p></div><div className="admin-patient-header-actions"><span className="live-indicator"><i/> Live patient queue</span><button type="button" className="primary-button" aria-expanded={showRegistration} aria-controls="admin-patient-registration" onClick={() => setShowRegistration(value => !value)}><Plus size={18}/> Add Patient</button></div></header>

    {showRegistration && <form id="admin-patient-registration" className="clinic-panel clinic-form admin-registration-form" onSubmit={registerPatient}><h2 className="serif">Add Patient</h2><PatientRegistrationFields form={form} onChange={e => setForm(current => ({ ...current, [e.target.name]: e.target.value }))}/><button className="primary-button" disabled={registering}>{registering ? 'Saving…' : 'Register Patient'}</button></form>}

    <div className="patient-stat-grid"><article><span className="stat-icon"><UsersRound /></span><div><strong>{activeCount}</strong><small>Active patients</small></div></article><article><span className="stat-icon"><CalendarDays /></span><div><strong>{todayCount}</strong><small>Active today</small></div></article><article><span className="stat-icon"><Stethoscope /></span><div><strong>{consultationCount}</strong><small>In consultation</small></div></article></div>

    <div className="admin-patient-workspace">
      <div className="admin-filter-bar"><div className="admin-patient-search"><Search/><input aria-label="Search clinic patients" placeholder="Search patient name, mobile or concern…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label="Clear search">×</button>}</div><input aria-label="Filter by visit date" className="admin-date-filter" type="date" value={date} onChange={e => setDate(e.target.value)}/><select aria-label="Filter by status" className="admin-status-filter" value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
      <div className="result-heading"><div><strong>{status === 'Active' ? 'Active patient queue' : `${status} patients`}</strong><span>{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span></div>{(query || date || status !== 'Active') && <button onClick={() => { setQuery(''); setDate(''); setStatus('Active'); }}>Clear all filters</button>}</div>
      {loading ? <div className="admin-patient-empty"><div className="loading-ring"/><strong>Loading clinic patients…</strong></div> : <div className="admin-patient-list">{filtered.length ? filtered.map(v => {
        const when = new Date(v.visit_at); const initials = v.patient_name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
        return <article className="admin-patient-card" key={v.id}>
          <div className="admin-patient-avatar">{initials}</div>
          <div className="admin-patient-main"><div className="admin-patient-title"><strong>{v.patient_name}</strong><span className={`visit-status status-${v.status.toLowerCase().replaceAll(' ', '-')}`}>{v.status}</span></div><div className="admin-patient-demographics">{v.age ? `${v.age} years` : 'Age not provided'}<i/> {v.gender || 'Gender not provided'}<i/><span><Phone/> {v.mobile}</span></div><div className="admin-patient-concern"><Stethoscope/><div><small>MAIN CONCERN</small><p>{v.concern || 'Not provided'}</p></div></div></div>
          <div className="admin-visit-info"><span><CalendarDays/>{when.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span><span><Clock3/>{when.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span><small><UserRoundCheck/> Sent by {v.created_by}</small></div>
          <div className="admin-card-actions">{isActiveVisit(v) && <button className="select-products-link" onClick={()=>choosePatient(v)}>Select Products</button>}<Link className="patient-details-link" to={`/admin/patients/${v.id}`}>Open patient <ChevronRight/></Link></div>
        </article>;
      }) : <div className="admin-patient-empty"><UserRoundCheck size={42}/><strong>{status === 'Active' ? 'No active patients in today’s queue' : `No ${status.toLowerCase()} patients found`}</strong><p>{query || date || status !== 'Active' ? 'Try adjusting your search or filters.' : 'Completed patients are stored safely and can be viewed using the Completed filter.'}</p></div>}</div>}
    </div>
    {activeVisit && <section ref={productSectionRef} className="inline-product-workspace"><header><div><span className="eyebrow">PATIENT RECOMMENDATION</span><h2 className="serif">Select Products for {activeVisit.patient_name}</h2><p>Selected products will appear in the print preview, followed by the patient consent letter.</p></div><span className="selected-product-count">{activeVisit.recommendations.length} selected</span></header>
      <div className="inline-product-filters"><div><Search/><input placeholder="Search product name or code…" value={productQuery} onChange={e=>setProductQuery(e.target.value)}/></div><select value={productCategory} onChange={e=>setProductCategory(e.target.value)}><option>All</option>{[...new Set(products.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="inline-product-grid">{visibleProducts.map(p=>{const selected=activeVisit.recommendations.some(r=>r.product_id===p.id);return <article className={selected?'selected':''} key={p.id} role={selected?'button':undefined} tabIndex={selected?0:undefined} onClick={()=>{if(selected)toggleProduct(p);}} onKeyDown={e=>{if(selected&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleProduct(p);}}}><img src={p.image_url} alt=""/><div><small>{p.category}</small><strong>{p.name}</strong><span>Code: {p.product_code}</span><b>₹{Number(p.price||0).toLocaleString('en-IN')}</b></div><button className={selected?'selected-product':''} onClick={e=>{e.stopPropagation();toggleProduct(p);}}>{selected?<><Check/>Selected</>:<><Plus/>Select Product</>}</button></article>})}</div>
      <div className="inline-selected-products"><h3 className="serif">Selected Products</h3>{activeVisit.recommendations.length?activeVisit.recommendations.map((r,i)=><article key={r.product_id}><div className="inline-selected-title"><strong>{r.name}</strong><small>{r.product_code}</small><button onClick={()=>removeProduct(i)} aria-label={`Remove ${r.name}`}><Trash2/></button></div><div className="inline-instruction-grid"><label>Quantity<input type="number" min="1" value={r.quantity} onChange={e=>updateRecommendation(i,'quantity',e.target.value)}/></label><label>Usage instructions<input value={r.instructions||''} placeholder="How to use" onChange={e=>updateRecommendation(i,'instructions',e.target.value)}/></label><label>Frequency<input value={r.frequency||''} placeholder="e.g. Twice daily" onChange={e=>updateRecommendation(i,'frequency',e.target.value)}/></label><label>Duration<input value={r.duration||''} placeholder="e.g. 30 days" onChange={e=>updateRecommendation(i,'duration',e.target.value)}/></label></div></article>):<p className="inline-products-empty">Select one or more products from the list above.</p>}</div>
      <div className="inline-product-footer"><div><FileText/><span><strong>Print preview includes consent letter</strong><small>Review the recommendation, collect consent and print two A4 pages.</small></span></div><button disabled={saving} onClick={saveAndPrint}>{saving?'Saving…':'Save & Continue to Print'}<ChevronRight/></button></div>
    </section>}
  </div></section>;
}
