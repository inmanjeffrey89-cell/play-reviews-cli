#!/usr/bin/env node
// play-reviews — fetch Google Play reviews for an app from the command line. No API key.
import { parsePackage, sortCode } from './src/play.js';
import { fetchReviewsPage } from './src/play-fetch.js';
const appRef = process.argv[2];
const max = parseInt(process.argv[3] || '100', 10);
if (!appRef) { console.error('Usage: node play-reviews.mjs <package-or-url> [maxReviews]'); process.exit(1); }
const appId = parsePackage(appRef);
if (!appId) { console.error('Not a valid Play package name or URL.'); process.exit(1); }
let token = null, out = [];
while (out.length < max) {
  const { reviews, token: next } = await fetchReviewsPage(appId, { count: 100, sort: sortCode('newest'), token });
  if (!reviews.length) break;
  out.push(...reviews); token = next; if (!token) break;
}
console.log(JSON.stringify(out.slice(0, max), null, 2));
