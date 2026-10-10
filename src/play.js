// Google Play reviews via the open PlayStoreUi batchexecute RPC (rpcid UsvDTd).
const PKG_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;
const SORTS = { relevance: 1, newest: 2, rating: 3 };

export function parsePackage(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (PKG_RE.test(s)) return s;
  // Take the whole id= value and validate it, so "id=com.app-beta" is rejected, never truncated.
  const m = s.match(/[?&]id=([^&#]*)/);
  return m && PKG_RE.test(decodeURIComponent(m[1])) ? decodeURIComponent(m[1]) : null;
}

// hl= / gl= from a Play URL, so a German store link fetches German reviews.
export function parseLocale(input) {
  const s = String(input ?? '');
  const hl = s.match(/[?&]hl=([a-zA-Z]{2,3}(?:[-_][a-zA-Z]{2,4})?)(?:[&#]|$)/)?.[1] ?? null;
  const gl = s.match(/[?&]gl=([a-zA-Z]{2})(?:[&#]|$)/)?.[1] ?? null;
  return { lang: hl ? hl.replace('_', '-') : null, country: gl ? gl.toLowerCase() : null };
}

export function sortCode(name) {
  return SORTS[name] ?? 2;
}

export function buildBody(appId, count, sort, token = null) {
  const inner = [null, null, [2, sort, [count, null, token], null, []], [appId, 7]];
  const freq = [[['UsvDTd', JSON.stringify(inner), null, 'generic']]];
  return 'f.req=' + encodeURIComponent(JSON.stringify(freq));
}

// Classify a batchexecute body: { kind: 'ok', payload } | { kind: 'rpc-error', status } |
// { kind: 'malformed' }. A missing package is 'ok' with an empty payload; a rejected request or
// continuation token comes back as a null payload plus a status array.
export function readEnvelope(raw) {
  const line = String(raw).split('\n').find((l) => l.includes('"UsvDTd"'));
  if (!line) return { kind: 'malformed' };
  let env;
  try { env = JSON.parse(line); } catch { return { kind: 'malformed' }; }
  const slot = env?.[0];
  if (!Array.isArray(slot)) return { kind: 'malformed' };
  if (slot[2] == null) return slot[5] ? { kind: 'rpc-error', status: slot[5] } : { kind: 'malformed' };
  try { return { kind: 'ok', payload: JSON.parse(slot[2]) }; } catch { return { kind: 'malformed' }; }
}

export function stripEnvelope(raw) {
  const line = raw.split('\n').find((l) => l.includes('"UsvDTd"'));
  if (!line) return null;
  try {
    const env = JSON.parse(line);
    const payloadStr = env[0]?.[2];
    return payloadStr ? JSON.parse(payloadStr) : null;
  } catch { return null; }
}

export function parseReviews(raw) {
  let payload;
  try { payload = stripEnvelope(raw); } catch { return []; }
  return parsePayloadReviews(payload);
}

export function parsePayloadReviews(payload) {
  if (!payload) return [];
  const reviews = payload[0];
  if (!Array.isArray(reviews)) return [];
  const out = [];
  for (const r of reviews) {
    if (!r || r[2] == null) continue;
    const ts = Array.isArray(r[5]) ? r[5][0] : null;
    out.push({
      reviewId: r[0] ?? null,
      author: r[1]?.[0] ?? null,
      rating: r[2],
      text: r[4] ?? '',
      date: ts ? new Date(ts * 1000).toISOString() : null,
      thumbsUp: r[6] ?? 0,
      version: r[10] ?? null,
    });
  }
  return out;
}

export function extractToken(payload) {
  return payload?.[1]?.[1] ?? null;
}
