import { buildBody, parseReviews, extractToken, stripEnvelope } from './play.js';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

export class PlayError extends Error {
  constructor(errorType, message, { retryable = false } = {}) { super(message); this.errorType = errorType; this.retryable = retryable; }
}

// Returns { reviews, token }.
export async function fetchReviewsPage(appId, { count = 100, sort = 2, token = null, country = 'us', lang = 'en', fetchImpl = fetch } = {}) {
  const url = `https://play.google.com/_/PlayStoreUi/data/batchexecute?hl=${lang}&gl=${country}&rpcids=UsvDTd`;
  let res;
  try {
    res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA }, body: buildBody(appId, count, sort, token) });
  } catch (e) { throw new PlayError('NETWORK', `request failed: ${e.message}`, { retryable: true }); }
  if (res.status === 429 || res.status === 403) throw new PlayError('BLOCKED', `HTTP ${res.status}`, { retryable: true });
  if (!res.ok) throw new PlayError('NETWORK', `HTTP ${res.status}`, { retryable: true });
  const raw = await res.text();
  const reviews = parseReviews(raw);
  const payload = stripEnvelope(raw);
  return { reviews, token: payload ? extractToken(payload) : null };
}
