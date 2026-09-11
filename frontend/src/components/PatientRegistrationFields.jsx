import React from 'react';

export const emptyPatientForm = () => ({ patient_name: '', mobile: '', age: '', gender: '', address: '', visit_at: '', appointment_at: '', concern: '', medical_conditions: '', allergies: '', current_medicines: '', previous_treatments: '', receptionist_notes: '', status: 'Waiting' });

export default function PatientRegistrationFields({ form, onChange }) {
  return <>
    <div className="form-grid">
      <label>Full name *<input name="patient_name" required value={form.patient_name} onChange={onChange} /></label>
      <label>Mobile number *<input name="mobile" type="tel" required pattern="[0-9+ \-]{7,20}" value={form.mobile} onChange={onChange} /></label>
      <label>Age<input name="age" type="number" min="0" max="130" value={form.age} onChange={onChange} /></label>
      <label>Gender<select name="gender" value={form.gender} onChange={onChange}><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select></label>
    </div>
    <label>Location<input name="address" value={form.address} onChange={onChange} placeholder="Village, city or address" /></label>
    <details className="patient-optional-details">
      <summary><span className="details-plus" aria-hidden="true">+</span> Additional details <small>Optional</small></summary>
      <div className="patient-optional-fields">
        <p>Leave these blank to register the visit with the current date and time.</p>
        <div className="form-grid">
          <label>Visit date &amp; time<input name="visit_at" type="datetime-local" value={form.visit_at} onChange={onChange} /></label>
          <label>Appointment time<input name="appointment_at" type="datetime-local" value={form.appointment_at} onChange={onChange} /></label>
        </div>
        <label>Main hair or skin concern<textarea name="concern" value={form.concern} onChange={onChange} /></label>
        <div className="form-grid">
          <label>Medical conditions<textarea name="medical_conditions" value={form.medical_conditions} onChange={onChange} /></label>
          <label>Allergies<textarea name="allergies" value={form.allergies} onChange={onChange} /></label>
          <label>Current medicines / treatments<textarea name="current_medicines" value={form.current_medicines} onChange={onChange} /></label>
          <label>Previous treatment history<textarea name="previous_treatments" value={form.previous_treatments} onChange={onChange} /></label>
        </div>
        <label>Notes for specialist<textarea name="receptionist_notes" value={form.receptionist_notes} onChange={onChange} /></label>
      </div>
    </details>
  </>;
}
