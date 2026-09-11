const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDirectory, 'patient-visits.json');
let visits = [];
try { visits = JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { visits = []; }
let nextId = visits.reduce((max, visit) => Math.max(max, Number(visit.id) || 0), 0) + 1;
const allowedStatuses = ['Waiting', 'In Consultation', 'Completed', 'Cancelled'];
const persistVisits = () => { fs.mkdirSync(dataDirectory, { recursive: true }); fs.writeFileSync(dataFile, JSON.stringify(visits, null, 2), { encoding: 'utf8', mode: 0o600 }); };

// Remove recommendations created from the retired H001-H012 demo catalogue.
// Real recommendations must be selected again so a patient never receives an
// incorrect product sheet based on an old sample product id.
let removedLegacyRecommendations = false;
visits = visits.map((visit) => {
  const recommendations = Array.isArray(visit.recommendations) ? visit.recommendations : [];
  const currentRecommendations = recommendations.filter((item) => !/^H\d{3}$/i.test(String(item.product_code || '')));
  if (currentRecommendations.length !== recommendations.length) removedLegacyRecommendations = true;
  return { ...visit, recommendations: currentRecommendations };
});
if (removedLegacyRecommendations) persistVisits();

const clean = (value, max = 2000) => String(value || '').trim().slice(0, max);

const normalizeVisit = (body, existing = {}) => ({
  ...existing,
  patient_name: clean(body.patient_name, 150),
  mobile: clean(body.mobile, 20),
  age: Number(body.age) || null,
  gender: clean(body.gender, 30),
  address: clean(body.address),
  concern: clean(body.concern),
  medical_conditions: clean(body.medical_conditions),
  allergies: clean(body.allergies),
  current_medicines: clean(body.current_medicines),
  previous_treatments: clean(body.previous_treatments),
  receptionist_notes: clean(body.receptionist_notes),
  visit_at: body.visit_at || new Date().toISOString(),
  appointment_at: body.appointment_at || body.visit_at || new Date().toISOString(),
  status: allowedStatuses.includes(body.status) ? body.status : 'Waiting',
  sent_to_admin: typeof body.sent_to_admin === 'boolean' ? body.sent_to_admin : Boolean(existing.sent_to_admin)
});

const listVisits = async (req, res) => {
  let result = visits;
  if (req.user.role === 'receptionist') result = result.filter(v => v.created_by === req.user.username);
  if (req.user.role === 'admin') result = result.filter(v => v.sent_to_admin);
  res.json({ success: true, data: result.sort((a, b) => new Date(b.visit_at) - new Date(a.visit_at)) });
};

const getVisit = async (req, res) => {
  const visit = visits.find(v => v.id === Number(req.params.id));
  if (!visit || (req.user.role === 'receptionist' && visit.created_by !== req.user.username) || (req.user.role === 'admin' && !visit.sent_to_admin)) {
    return res.status(404).json({ success: false, message: 'Patient visit not found.' });
  }
  res.json({ success: true, data: visit });
};

const createVisit = async (req, res) => {
  const data = normalizeVisit(req.body);
  if (!data.patient_name || !data.mobile) {
    return res.status(400).json({ success: false, message: 'Patient name and mobile number are required.' });
  }
  const now = new Date().toISOString();
  // Admin registrations enter the clinic queue immediately; reception still hands over visits.
  data.sent_to_admin = req.user.role === 'admin';
  if (data.sent_to_admin) data.sent_to_admin_at = now;
  const visit = { id: nextId++, ...data, created_by: req.user.username, updated_by: req.user.username, consultation_notes: '', diagnosis: '', recommended_treatment: '', follow_up_date: '', private_admin_notes: '', recommendations: [], created_at: now, updated_at: now };
  visits.push(visit);
  persistVisits();
  res.status(201).json({ success: true, data: visit });
};

const updateVisit = async (req, res) => {
  const index = visits.findIndex(v => v.id === Number(req.params.id));
  if (index < 0 || (req.user.role === 'receptionist' && visits[index].created_by !== req.user.username) || (req.user.role === 'admin' && !visits[index].sent_to_admin)) {
    return res.status(404).json({ success: false, message: 'Patient visit not found.' });
  }
  const original = visits[index];
  const base = normalizeVisit(req.body, original);
  if (req.user.role === 'admin' && original.consent?.locked && req.body.consent && JSON.stringify(req.body.consent) !== JSON.stringify(original.consent)) {
    return res.status(409).json({ success: false, message: 'Completed consent is locked. Create a new consent revision instead of editing it.' });
  }
  const normalizedRecommendations = Array.isArray(req.body.recommendations)
    ? req.body.recommendations.map(r => ({ product_id: Number(r.product_id), name: clean(r.name, 150), product_code: clean(r.product_code, 50), category: clean(r.category, 100), image_url: clean(r.image_url, 2000), price: Number(r.price) || 0, quantity: Math.max(1, Number(r.quantity) || 1), instructions: clean(r.instructions, 500), frequency: clean(r.frequency, 100), duration: clean(r.duration, 100), timing: clean(r.timing, 100), food_timing: clean(r.food_timing, 100), additional_instructions: clean(r.additional_instructions, 500) })) : original.recommendations;
  const incomingConsent = req.body.consent && typeof req.body.consent === 'object' ? req.body.consent : null;
  const consent = incomingConsent ? {
    accepted: incomingConsent.accepted === true,
    physical_signature: incomingConsent.physical_signature === true,
    patient_signature: clean(incomingConsent.patient_signature, 150000),
    admin_signature: clean(incomingConsent.admin_signature, 150000),
    witness_signature: clean(incomingConsent.witness_signature, 150000),
    patient_questions: clean(incomingConsent.patient_questions),
    consented_at: incomingConsent.consented_at || '',
    version: Number(incomingConsent.version) || Number(original.consent?.version) || 1,
    recorded_by: req.user.username,
    locked: incomingConsent.locked === true
  } : original.consent;
  const adminFields = req.user.role === 'admin' ? {
    consultation_notes: clean(req.body.consultation_notes), diagnosis: clean(req.body.diagnosis),
    recommended_treatment: clean(req.body.recommended_treatment), follow_up_date: req.body.follow_up_date || '',
    private_admin_notes: clean(req.body.private_admin_notes), recommendations: normalizedRecommendations,
    consent, consent_revisions: Array.isArray(original.consent_revisions) ? original.consent_revisions : []
  } : {};
  const sentAt = !original.sent_to_admin && base.sent_to_admin ? new Date().toISOString() : original.sent_to_admin_at;
  visits[index] = { ...base, ...adminFields, sent_to_admin_at: sentAt, updated_by: req.user.username, updated_at: new Date().toISOString() };
  persistVisits();
  res.json({ success: true, data: visits[index] });
};

module.exports = { listVisits, getVisit, createVisit, updateVisit };
