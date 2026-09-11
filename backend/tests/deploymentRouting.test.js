const { test } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../../vercel.json');

const destinationFor = path => config.rewrites.find(rule => new RegExp(`^${rule.source}$`).test(path))?.destination;

test('direct application links serve the React entry document', () => {
  for (const path of ['/admin', '/admin/login', '/admin/dashboard', '/admin/patients/123/print', '/receptionist', '/receptionist/add-patient', '/hair-styles', '/hair-styles/admin', '/products', '/selected-products', '/selected-styles', '/transformations']) {
    assert.deepEqual(destinationFor(path), { type: 'service', service: 'frontend', path: '/index.html' });
  }
});

test('API requests remain backend requests, including unknown endpoints', () => {
  for (const path of ['/api', '/api/health', '/api/auth/login', '/api/patient-visits', '/api/missing']) {
    assert.equal(destinationFor(path).service, 'backend');
    assert.equal(destinationFor(path).path, undefined);
  }
});

test('static files retain their original paths', () => {
  for (const path of ['/', '/assets/index.js', '/brand/dipali-wakale-logo.png', '/instagram/reels/hair-transformation.mp4', '/products/hairiva-serum.png']) {
    // /products is both an app page and an asset folder; image paths must not return HTML.
    assert.equal(destinationFor(path).service, 'frontend');
    assert.equal(destinationFor(path).path, undefined);
  }
});
