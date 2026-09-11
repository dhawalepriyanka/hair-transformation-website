const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Isolated storage: these tests never read or change real patient records.
function controller() {
  let stored = '[]';
  const sandbox = { module: { exports: {} }, __dirname: path.resolve(__dirname, '../controllers'), require(name) {
    if (name === 'fs') return { readFileSync: () => stored, mkdirSync() {}, writeFileSync: (_, value) => { stored = value; } };
    if (name === 'path') return path;
    if (name === '../config/db') return {};
    throw new Error(`Unexpected dependency: ${name}`);
  } };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../controllers/patientController.js'), 'utf8'), sandbox);
  return { ...sandbox.module.exports, saved: () => JSON.parse(stored) };
}
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
const admin = { role: 'admin', username: 'test_admin' };
const receptionist = { role: 'receptionist', username: 'test_reception' };
const basic = { patient_name: 'Test Patient', mobile: '9000000000', age: '32', gender: 'Female', address: 'Test location' };

test('Admin can register basic details and the saved visit appears in the existing queue', async () => {
  const c = controller(); const res = response(); const start = Date.now();
  await c.createVisit({ user: admin, body: basic }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.data.concern, '');
  assert.equal(res.body.data.sent_to_admin, true);
  assert.ok(new Date(res.body.data.visit_at).getTime() >= start);
  assert.equal(c.saved()[0].address, basic.address);
  const list = response(); await c.listVisits({ user: admin }, list);
  assert.equal(list.body.data.length, 1);
});
test('Reception registration still requires the existing handover before appearing for Admin', async () => {
  const c = controller(); const res = response();
  await c.createVisit({ user: receptionist, body: basic }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.data.sent_to_admin, false);
  const list = response(); await c.listVisits({ user: admin }, list);
  assert.equal(list.body.data.length, 0);
  const sent = response(); await c.updateVisit({ user: receptionist, params: { id: res.body.data.id }, body: { ...res.body.data, sent_to_admin: true, status: 'In Consultation' } }, sent);
  await c.listVisits({ user: admin }, list);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].status, 'In Consultation');
});
test('Name and mobile remain required; no incomplete record is saved', async () => {
  const c = controller();
  for (const body of [{ mobile: basic.mobile }, { patient_name: basic.patient_name }]) {
    const res = response(); await c.createVisit({ user: admin, body }, res);
    assert.equal(res.code, 400);
  }
  assert.equal(c.saved().length, 0);
});
test('Optional details and older dates are saved and remain visible to Admin', async () => {
  const c = controller(); const res = response();
  await c.createVisit({ user: admin, body: { ...basic, concern: 'Optional note', visit_at: '2026-09-10T10:00:00+05:30' } }, res);
  const list = response(); await c.listVisits({ user: admin }, list);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].concern, 'Optional note');
  assert.equal(list.body.data[0].visit_at, '2026-09-10T10:00:00+05:30');
});
