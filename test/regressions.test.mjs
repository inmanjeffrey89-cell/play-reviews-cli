import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cli } from './cli.mjs';

test('Play rejecting page 2 is a partial run: data kept, complete:false, exit 2', () => {
  const r = cli(['com.whatsapp', '250', '--json'], { preload: 'play-rpc-error-page2' });
  assert.equal(r.status, 2, r.stderr);
  const env = JSON.parse(r.stdout);
  assert.equal(env.complete, false);
  assert.equal(env.count, 100);
  assert.equal(JSON.parse(r.stderr).error.type, 'RPC_ERROR');
});

test('a consent/captcha page is an upstream failure (exit 2), not "no reviews"', () => {
  const r = cli(['com.whatsapp', '--json'], { preload: 'play-html' });
  assert.equal(r.status, 2, r.stderr);
  assert.equal(JSON.parse(r.stderr).error.type, 'BAD_RESPONSE');
});

test('a URL whose id is not a valid package is rejected, never truncated to a different app', () => {
  const r = cli(['https://play.google.com/store/apps/details?id=com.whatsapp-beta'], { preload: 'play-one-page' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /INVALID_INPUT/);
});

test('hl= and gl= in the link select the review language and country', () => {
  const r = cli(['https://play.google.com/store/apps/details?id=com.whatsapp&hl=de&gl=DE', '--json'], { preload: 'play-one-page' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).input, { appId: 'com.whatsapp', country: 'de', lang: 'de', maxReviews: 100 });
});
