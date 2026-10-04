// Google Play reviews via the open PlayStoreUi batchexecute RPC (rpcid UsvDTd).
const PKG_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;
const SORTS = { relevance: 1, newest: 2, rating: 3 };

export function parsePackage(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (PKG_RE.test(s)) return s;
  const m = s.match(/[?&]id=([a-zA-Z0-9._]+)/);
  return m && PKG_RE.test(m[1]) ? m[1] : null;
}

export function sortCode(name) {
  return SORTS[name] ?? 2;
}

export function buildBody(appId, count, sort, token = null) {
  const inner = [null, null, [2, sort, [count, null, token], null, []], [appId, 7]];
  const freq = [[['UsvDTd', JSON.stringify(inner), null, 'generic']]];
  return 'f.req=' + encodeURIComponent(JSON.stringify(freq));
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
