const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function controller() {
  const sandbox = {
    module: { exports: {} },
    require(name) {
      if (name === '../config/db') return { pool: {} };
      throw new Error(`Unexpected dependency: ${name}`);
    }
  };
  vm.runInNewContext(
    fs.readFileSync(path.resolve(__dirname, '../controllers/patientController.js'), 'utf8'),
    sandbox
  );
  return sandbox.module.exports;
}

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

const basic = {
  patient_name: 'Test Patient',
  mobile: '9000000000',
  age: '32',
  gender: 'Female',
  address: 'Test location'
};

test('Basic patient details normalize into a new waiting visit', () => {
  const { normalizeVisit } = controller();
  const start = Date.now();
  const visit = normalizeVisit(basic);
  assert.equal(visit.patient_name, basic.patient_name);
  assert.equal(visit.mobile, basic.mobile);
  assert.equal(visit.age, 32);
  assert.equal(visit.concern, '');
  assert.equal(visit.status, 'Waiting');
  assert.ok(new Date(visit.visit_at).getTime() >= start);
});

test('An update preserves patient fields that were not resubmitted', () => {
  const { normalizeVisit } = controller();
  const existing = { ...basic, age: 32, sent_to_admin: false, status: 'Waiting', visit_at: '2026-09-10T10:00:00+05:30' };
  const visit = normalizeVisit({ sent_to_admin: true, status: 'In Consultation' }, existing);
  assert.equal(visit.patient_name, basic.patient_name);
  assert.equal(visit.mobile, basic.mobile);
  assert.equal(visit.sent_to_admin, true);
  assert.equal(visit.status, 'In Consultation');
});

test('Name and mobile remain required before a database connection is attempted', async () => {
  const { createVisit } = controller();
  for (const body of [{ mobile: basic.mobile }, { patient_name: basic.patient_name }]) {
    const res = response();
    await createVisit({ user: { role: 'admin', username: 'test_admin' }, body }, res);
    assert.equal(res.code, 400);
    assert.equal(res.body.success, false);
  }
});

test('Optional details and an explicitly selected visit date are retained', () => {
  const { normalizeVisit } = controller();
  const visit = normalizeVisit({
    ...basic,
    concern: 'Optional note',
    visit_at: '2026-09-10T10:00:00+05:30'
  });
  assert.equal(visit.concern, 'Optional note');
  assert.equal(visit.visit_at, '2026-09-10T10:00:00+05:30');
});
