const { pool } = require('../config/db');

const allowedStatuses = ['Waiting', 'In Consultation', 'Completed', 'Cancelled'];
const clean = (value, max = 2000) => String(value ?? '').trim().slice(0, max);
const fromBody = (body, existing, key) => body[key] === undefined ? existing[key] : body[key];

const normalizeVisit = (body = {}, existing = {}) => ({
  patient_name: clean(fromBody(body, existing, 'patient_name'), 150),
  mobile: clean(fromBody(body, existing, 'mobile'), 20),
  age: Number(fromBody(body, existing, 'age')) || null,
  gender: clean(fromBody(body, existing, 'gender'), 30),
  address: clean(fromBody(body, existing, 'address')),
  concern: clean(fromBody(body, existing, 'concern')),
  medical_conditions: clean(fromBody(body, existing, 'medical_conditions')),
  allergies: clean(fromBody(body, existing, 'allergies')),
  current_medicines: clean(fromBody(body, existing, 'current_medicines')),
  previous_treatments: clean(fromBody(body, existing, 'previous_treatments')),
  receptionist_notes: clean(fromBody(body, existing, 'receptionist_notes')),
  visit_at: fromBody(body, existing, 'visit_at') || new Date().toISOString(),
  appointment_at: fromBody(body, existing, 'appointment_at') || fromBody(body, existing, 'visit_at') || new Date().toISOString(),
  status: allowedStatuses.includes(fromBody(body, existing, 'status')) ? fromBody(body, existing, 'status') : 'Waiting',
  sent_to_admin: typeof body.sent_to_admin === 'boolean' ? body.sent_to_admin : Boolean(existing.sent_to_admin)
});

const visitSelect = `
  SELECT
    v.id,
    p.full_name AS patient_name,
    p.mobile,
    p.age,
    p.gender,
    p.address,
    v.concern,
    v.medical_conditions,
    v.allergies,
    v.current_medicines,
    v.previous_treatments,
    v.receptionist_notes,
    v.visit_at,
    v.appointment_at,
    v.status,
    v.sent_to_admin,
    v.sent_to_admin_at,
    v.created_by_username AS created_by,
    v.updated_by_username AS updated_by,
    v.created_at,
    v.updated_at,
    COALESCE(c.consultation_notes, '') AS consultation_notes,
    COALESCE(c.diagnosis, '') AS diagnosis,
    COALESCE(c.recommended_treatment, '') AS recommended_treatment,
    COALESCE(c.follow_up_date::text, '') AS follow_up_date,
    COALESCE(c.private_admin_notes, '') AS private_admin_notes,
    COALESCE((
      SELECT json_agg(recommendation.item ORDER BY recommendation.item_id)
      FROM (
        SELECT
          i.id AS item_id,
          json_build_object(
            'product_id', i.product_id,
            'name', product.name,
            'product_code', product.product_code,
            'category', product.category,
            'image_url', product.image_url,
            'price', product.price,
            'quantity', i.quantity,
            'instructions', COALESCE(i.usage_instructions, ''),
            'frequency', COALESCE(i.frequency, ''),
            'duration', COALESCE(i.duration, ''),
            'timing', COALESCE(i.timing, ''),
            'food_timing', COALESCE(i.food_timing, ''),
            'additional_instructions', COALESCE(i.additional_instructions, '')
          ) AS item
        FROM product_recommendations recommendation_header
        JOIN recommended_product_items i ON i.recommendation_id = recommendation_header.id
        JOIN products product ON product.id = i.product_id
        WHERE recommendation_header.visit_id = v.id
      ) recommendation
    ), '[]'::json) AS recommendations,
    (
      SELECT json_build_object(
        'accepted', consent.accepted,
        'physical_signature', consent.physical_signature,
        'patient_signature', COALESCE(consent.patient_signature, ''),
        'admin_signature', COALESCE(consent.specialist_signature, ''),
        'witness_signature', COALESCE(consent.witness_signature, ''),
        'patient_questions', COALESCE(consent.patient_questions, ''),
        'consented_at', consent.consented_at,
        'version', consent.version,
        'recorded_by', COALESCE(consent.recorded_by_username, staff.username, ''),
        'locked', consent.locked
      )
      FROM patient_consents consent
      LEFT JOIN staff_users staff ON staff.id = consent.recorded_by
      WHERE consent.visit_id = v.id
      ORDER BY consent.version DESC
      LIMIT 1
    ) AS consent
  FROM patient_visits v
  JOIN patients p ON p.id = v.patient_id
  LEFT JOIN consultations c ON c.visit_id = v.id
`;

const getVisitById = async (client, id) => {
  const result = await client.query(`${visitSelect} WHERE v.id = $1`, [id]);
  return result.rows[0] || null;
};

const canAccess = (visit, user) => {
  if (!visit) return false;
  if (user.role === 'admin') return visit.sent_to_admin === true;
  return visit.created_by_username === user.username;
};

const listVisits = async (req, res, next) => {
  try {
    const condition = req.user.role === 'admin'
      ? 'v.sent_to_admin = TRUE'
      : 'v.created_by_username = $1';
    const values = req.user.role === 'admin' ? [] : [req.user.username];
    const result = await pool.query(`${visitSelect} WHERE ${condition} ORDER BY v.visit_at DESC`, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getVisit = async (req, res, next) => {
  try {
    const visit = await getVisitById(pool, Number(req.params.id));
    if (!visit || (req.user.role === 'admin' && !visit.sent_to_admin) || (req.user.role === 'receptionist' && visit.created_by !== req.user.username)) {
      return res.status(404).json({ success: false, message: 'Patient visit not found.' });
    }
    res.json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

const createVisit = async (req, res, next) => {
  const data = normalizeVisit(req.body);
  if (!data.patient_name || !data.mobile) {
    return res.status(400).json({ success: false, message: 'Patient name and mobile number are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const patientResult = await client.query(`
      INSERT INTO patients (full_name, mobile, age, gender, address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (mobile) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age = COALESCE(EXCLUDED.age, patients.age),
        gender = COALESCE(NULLIF(EXCLUDED.gender, ''), patients.gender),
        address = COALESCE(NULLIF(EXCLUDED.address, ''), patients.address),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [data.patient_name, data.mobile, data.age, data.gender, data.address]);

    const sentToAdmin = req.user.role === 'admin';
    const visitResult = await client.query(`
      INSERT INTO patient_visits (
        patient_id, concern, medical_conditions, allergies, current_medicines,
        previous_treatments, receptionist_notes, visit_at, appointment_at,
        status, sent_to_admin, sent_to_admin_at, created_by_username, updated_by_username
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE NULL END, $12, $12
      ) RETURNING id
    `, [
      patientResult.rows[0].id, data.concern, data.medical_conditions, data.allergies,
      data.current_medicines, data.previous_treatments, data.receptionist_notes,
      data.visit_at, data.appointment_at, data.status, sentToAdmin, req.user.username
    ]);

    await client.query('COMMIT');
    const visit = await getVisitById(pool, visitResult.rows[0].id);
    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const updateVisit = async (req, res, next) => {
  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query(`
      SELECT v.*, p.full_name AS patient_name, p.mobile, p.age, p.gender, p.address
      FROM patient_visits v
      JOIN patients p ON p.id = v.patient_id
      WHERE v.id = $1
      FOR UPDATE OF v
    `, [id]);
    const existing = existingResult.rows[0];
    if (!canAccess(existing, req.user)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Patient visit not found.' });
    }

    const data = normalizeVisit(req.body, existing);
    if (!data.patient_name || !data.mobile) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Patient name and mobile number are required.' });
    }

    await client.query(`
      UPDATE patients SET full_name = $1, mobile = $2, age = $3, gender = $4,
        address = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [data.patient_name, data.mobile, data.age, data.gender, data.address, existing.patient_id]);

    await client.query(`
      UPDATE patient_visits SET
        concern = $1, medical_conditions = $2, allergies = $3, current_medicines = $4,
        previous_treatments = $5, receptionist_notes = $6, visit_at = $7,
        appointment_at = $8, status = $9, sent_to_admin = $10,
        sent_to_admin_at = CASE WHEN sent_to_admin = FALSE AND $10 = TRUE THEN CURRENT_TIMESTAMP ELSE sent_to_admin_at END,
        updated_by_username = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `, [
      data.concern, data.medical_conditions, data.allergies, data.current_medicines,
      data.previous_treatments, data.receptionist_notes, data.visit_at, data.appointment_at,
      data.status, data.sent_to_admin, req.user.username, id
    ]);

    if (req.user.role === 'admin') {
      await client.query(`
        INSERT INTO consultations (
          visit_id, consultation_notes, diagnosis, recommended_treatment,
          follow_up_date, private_admin_notes, updated_at
        ) VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (visit_id) DO UPDATE SET
          consultation_notes = EXCLUDED.consultation_notes,
          diagnosis = EXCLUDED.diagnosis,
          recommended_treatment = EXCLUDED.recommended_treatment,
          follow_up_date = EXCLUDED.follow_up_date,
          private_admin_notes = EXCLUDED.private_admin_notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        id, clean(req.body.consultation_notes), clean(req.body.diagnosis),
        clean(req.body.recommended_treatment), req.body.follow_up_date || '',
        clean(req.body.private_admin_notes)
      ]);

      if (Array.isArray(req.body.recommendations)) {
        await client.query('DELETE FROM product_recommendations WHERE visit_id = $1', [id]);
        if (req.body.recommendations.length) {
          const recommendationResult = await client.query(`
            INSERT INTO product_recommendations (visit_id, created_at, updated_at)
            VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
          `, [id]);
          for (const item of req.body.recommendations) {
            await client.query(`
              INSERT INTO recommended_product_items (
                recommendation_id, product_id, quantity, usage_instructions,
                frequency, duration, timing, food_timing, additional_instructions
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              recommendationResult.rows[0].id, Number(item.product_id),
              Math.max(1, Number(item.quantity) || 1), clean(item.instructions, 500),
              clean(item.frequency, 100), clean(item.duration, 100),
              clean(item.timing, 100), clean(item.food_timing, 100),
              clean(item.additional_instructions, 500)
            ]);
          }
        }
      }

      if (req.body.consent && typeof req.body.consent === 'object') {
        const consent = req.body.consent;
        const latestConsent = await client.query(`
          SELECT version, locked FROM patient_consents
          WHERE visit_id = $1 ORDER BY version DESC LIMIT 1 FOR UPDATE
        `, [id]);
        if (latestConsent.rows[0]?.locked) {
          await client.query('ROLLBACK');
          return res.status(409).json({ success: false, message: 'Completed consent is locked.' });
        }
        const version = Number(consent.version) || latestConsent.rows[0]?.version || 1;
        await client.query(`
          INSERT INTO patient_consents (
            visit_id, version, accepted, physical_signature, patient_signature,
            specialist_signature, witness_signature, patient_questions,
            consented_at, recorded_by_username, locked
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULLIF($9, '')::timestamp, $10, $11)
          ON CONFLICT (visit_id, version) DO UPDATE SET
            accepted = EXCLUDED.accepted,
            physical_signature = EXCLUDED.physical_signature,
            patient_signature = EXCLUDED.patient_signature,
            specialist_signature = EXCLUDED.specialist_signature,
            witness_signature = EXCLUDED.witness_signature,
            patient_questions = EXCLUDED.patient_questions,
            consented_at = EXCLUDED.consented_at,
            recorded_by_username = EXCLUDED.recorded_by_username,
            locked = EXCLUDED.locked
        `, [
          id, version, consent.accepted === true, consent.physical_signature === true,
          clean(consent.patient_signature, 150000), clean(consent.admin_signature, 150000),
          clean(consent.witness_signature, 150000), clean(consent.patient_questions),
          consent.consented_at || '', req.user.username, consent.locked === true
        ]);
      }
    }

    await client.query('COMMIT');
    const visit = await getVisitById(pool, id);
    res.json({ success: true, data: visit });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'That mobile number is already assigned to another patient.' });
    }
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { listVisits, getVisit, createVisit, updateVisit, normalizeVisit };
