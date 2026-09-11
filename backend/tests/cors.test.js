const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCorsOptions } = require('../config/cors');

const check = (origin, env = {}) => new Promise(resolve => createCorsOptions(env).origin(origin, (error, allowed) => resolve({ error, allowed })));

test('canonical and main-branch addresses both allow login requests', async () => {
  for (const origin of ['https://hair-transformation-website.vercel.app', 'https://hair-transformation-website-git-main-dhawalepriyankas-projects.vercel.app', undefined]) {
    assert.equal((await check(origin)).allowed, true);
  }
});

test('only exact deployment addresses and configured clinic domains are trusted', async () => {
  const env = { VERCEL_URL: 'clinic-test-team.vercel.app', CORS_ORIGINS: 'https://dipaliwakale.in, https://www.dipaliwakale.in' };
  for (const origin of ['https://clinic-test-team.vercel.app', 'https://dipaliwakale.in', 'https://www.dipaliwakale.in']) {
    assert.equal((await check(origin, env)).allowed, true);
  }
  for (const origin of ['https://unrelated.vercel.app', 'https://clinic-test-team.vercel.app.evil.example', 'http://clinic-test-team.vercel.app', 'null']) {
    const result = await check(origin, env);
    assert.equal(result.allowed, undefined);
    assert.equal(result.error.status, 403);
  }
});
