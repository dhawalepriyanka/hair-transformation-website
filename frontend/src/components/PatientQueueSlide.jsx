import React from 'react';
import { Users, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PatientQueueSlide({ queue = [] }) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  
  // Patient currently in consultation (or first waiting patient if none in consultation)
  const inConsultationPatient = safeQueue.find(p => p.status === 'In Consultation');
  const nowServing = inConsultationPatient || (safeQueue.length > 0 && safeQueue[0].status === 'Waiting' ? safeQueue[0] : null);
  
  // Waiting queue (all other patients)
  const waitingList = nowServing
    ? safeQueue.filter(p => p.id !== nowServing.id)
    : safeQueue;

  const hasActivePatients = safeQueue.length > 0;

  return (
    <div className="tv-queue-slide tv-apk-fade-in">
      {/* ── LUXURY HEADER ── */}
      <div className="tv-queue-header">
        <div className="tv-queue-header-left">
          <span className="tv-queue-scissors">✂</span>
          <div>
            <h1 className="tv-queue-brand">DIPALI WAKALE</h1>
            <p className="tv-queue-sub">HAIR &amp; SKIN CARE CLINIC</p>
          </div>
        </div>

        <div className="tv-queue-header-center">
          <div className="tv-queue-title-pill">
            <span className="tv-queue-live-dot" />
            <span>LIVE PATIENT QUEUE &amp; CONSULTATION STATUS</span>
          </div>
        </div>

        <div className="tv-queue-header-right">
          <div className="tv-queue-count-badge">
            <Users size={16} strokeWidth={2.4} />
            <span>{safeQueue.length} Active {safeQueue.length === 1 ? 'Patient' : 'Patients'}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {hasActivePatients ? (
        <div className="tv-queue-grid">
          {/* ── LEFT HERO: NOW IN CONSULTATION ── */}
          <div className="tv-queue-hero-card">
            <div className="tv-queue-hero-badge">
              <span className="tv-queue-pulse-green" />
              <span>{nowServing.status === 'In Consultation' ? 'NOW IN CONSULTATION' : 'NOW CALLING / NEXT'}</span>
            </div>

            <div className="tv-queue-token-display">
              <span className="tv-queue-token-label">TOKEN NUMBER</span>
              <span className="tv-queue-token-number">
                #{String(nowServing.token_number || 1).padStart(2, '0')}
              </span>
            </div>

            <div className="tv-queue-patient-info">
              <h2 className="tv-queue-patient-name">{nowServing.patient_name}</h2>
              <div className="tv-queue-concern-tag">
                <Sparkles size={16} className="tv-queue-sparkle-icon" />
                <span>{nowServing.concern || 'Hair & Skin Consultation'}</span>
              </div>
            </div>

            <div className="tv-queue-specialist-box">
              <div className="tv-queue-spec-title">Consulting Specialist</div>
              <div className="tv-queue-spec-name">Dipali Wakale</div>
              <div className="tv-queue-spec-role">Hair Artist &amp; Clinic Director • Studio 1</div>
            </div>
          </div>

          {/* ── RIGHT LIST: UP NEXT / WAITING QUEUE ── */}
          <div className="tv-queue-list-card">
            <div className="tv-queue-list-header">
              <div className="tv-queue-list-title">
                <Clock size={18} strokeWidth={2.4} />
                <span>Waiting Lounge Queue</span>
              </div>
              <span className="tv-queue-waiting-counter">
                {waitingList.length} in waiting
              </span>
            </div>

            {waitingList.length > 0 ? (
              <div className="tv-queue-table">
                <div className="tv-queue-table-head">
                  <span>TOKEN</span>
                  <span>PATIENT NAME</span>
                  <span>SERVICE / CONCERN</span>
                  <span>STATUS</span>
                </div>

                <div className="tv-queue-table-body">
                  {waitingList.slice(0, 6).map((item, idx) => (
                    <div className="tv-queue-row" key={item.id || idx}>
                      <span className="tv-queue-row-token">
                        #{String(item.token_number || idx + 2).padStart(2, '0')}
                      </span>
                      <span className="tv-queue-row-name">
                        {item.patient_name}
                      </span>
                      <span className="tv-queue-row-concern">
                        {item.concern || 'Hair & Skin Care'}
                      </span>
                      <span className="tv-queue-row-status">
                        {idx === 0 ? (
                          <span className="tv-queue-status-next">🟡 Next Up</span>
                        ) : (
                          <span className="tv-queue-status-waiting">⏳ Waiting</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tv-queue-empty-waiting">
                <CheckCircle2 size={38} strokeWidth={2} style={{ color: '#E4B49F' }} />
                <h3>No Other Patients Waiting</h3>
                <p>New arrivals registered at reception will appear here immediately.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── EMPTY QUEUE STATE ── */
        <div className="tv-queue-calm-state">
          <div className="tv-queue-calm-emblem">✂</div>
          <h2 className="tv-queue-calm-title">CONSULTATIONS ON SCHEDULE</h2>
          <p className="tv-queue-calm-sub">
            All registered patient visits are up to date.
          </p>
          <div className="tv-queue-calm-badge">
            ✦ Welcome to Dipali Wakale Hair &amp; Skin Care Clinic ✦
          </div>
          <p className="tv-queue-calm-hint">
            Please register at the reception desk to be seated for consultation.
          </p>
        </div>
      )}

      {/* ── FOOTER TICKER BANNER ── */}
      <div className="tv-queue-footer">
        <span className="tv-queue-ticker-star">✦</span>
        <span>Please relax in our luxury lounge. Complimentary refreshments available. Our staff will call your token number shortly.</span>
        <span className="tv-queue-ticker-star">✦</span>
      </div>
    </div>
  );
}
