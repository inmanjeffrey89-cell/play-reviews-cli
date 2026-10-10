#!/usr/bin/env node
// play-reviews — fetch Google Play reviews for an app from the command line. No API key.
import { run, CliError } from './src/cli.js';
import { parsePackage, parseLocale, sortCode } from './src/play.js';
import { fetchReviewsPage } from './src/play-fetch.js';

const usage = `Usage: play-reviews <package-or-url> [maxReviews] [--json]

  package-or-url  e.g. com.spotify.music or a play.google.com/store/apps/details?id=... link
                  (hl= and gl= in the link pick the review language and country; default en / us)
  maxReviews      stop after this many, newest first (default: 100)
  --json          print one JSON envelope instead of a bare JSON array

Exit: 0 ok · 1 bad input · 2 Play request failed · 3 no reviews (none yet, or no such package)`;

run({
  tool: 'play-reviews',
  usage,
  positionals: 2,
  async main(args) {
    const [ref, maxArg = '100'] = args.positional;
    if (!ref) throw new CliError('USAGE', 'missing <package-or-url>');
    const appId = parsePackage(ref);
    if (!appId) throw new CliError('INVALID_INPUT', `not a Play package name or URL: ${ref}`);
    const locale = parseLocale(ref);
    const lang = locale.lang ?? 'en';
    const country = locale.country ?? 'us';
    const max = Number(maxArg);
    if (!Number.isInteger(max) || max < 1) throw new CliError('INVALID_INPUT', `maxReviews must be a positive integer, got "${maxArg}"`);

    const results = [];
    let token = null;
    let error = null;
    while (results.length < max) {
      let page;
      try {
        page = await fetchReviewsPage(appId, { count: 100, sort: sortCode('newest'), token, country, lang });
      } catch (e) {
        error = results.length
          ? new CliError(e.errorType || 'INTERNAL', `stopped after ${results.length} reviews: ${e.message}`, { retryable: !!e.retryable })
          : e;
        break;
      }
      if (!page.reviews.length) break;
      results.push(...page.reviews);
      token = page.token;
      if (!token) break;
    }
    const reviews = results.slice(0, max);
    return {
      input: { appId, country, lang, maxReviews: max },
      results: reviews,
      error,
      emptyMessage: `no reviews for ${appId} (the app has none yet, or the package doesn't exist)`,
      human: () => JSON.stringify(reviews, null, 2) + '\n',
    };
  },
});
