import { buildBody, readEnvelope, parsePayloadReviews, extractToken } from './play.js';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

export class PlayError extends Error {
  constructor(errorType, message, { retryable = false } = {}) { super(message); this.errorType = errorType; this.retryable = retryable; }
}

// Returns { reviews, token }.
export async function fetchReviewsPage(appId, { count = 100, sort = 2, token = null, country = 'us', lang = 'en', fetchImpl = fetch } = {}) {
  const url = `https://play.google.com/_/PlayStoreUi/data/batchexecute?hl=${lang}&gl=${country}&rpcids=UsvDTd`;
  let res, raw;
  try {
    res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': UA }, body: buildBody(appId, count, sort, token) });
    raw = await res.text();
  } catch (e) { throw new PlayError('NETWORK', `request failed: ${e.message}`, { retryable: true }); }
  if (res.status === 429 || res.status === 403) throw new PlayError('BLOCKED', `HTTP ${res.status}`, { retryable: true });
  if (res.status === 400) throw new PlayError('INVALID_REQUEST', `Play rejected the request (HTTP 400; check the package name, hl and gl)`);
  if (!res.ok) throw new PlayError('NETWORK', `HTTP ${res.status}`, { retryable: res.status >= 500 || res.status === 408 });
  const env = readEnvelope(raw);
  if (env.kind === 'rpc-error') throw new PlayError('RPC_ERROR', `Play returned an error for this request (status ${JSON.stringify(env.status[0] ?? env.status)})`, { retryable: true });
  if (env.kind === 'malformed') throw new PlayError('BAD_RESPONSE', 'Play answered with something other than review data (a captcha or consent page?)', { retryable: true });
  return { reviews: parsePayloadReviews(env.payload), token: extractToken(env.payload) };
}
