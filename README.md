# play-reviews

Fetch **Google Play Store reviews** for any Android app from the command line: rating, text, version, author, date, as JSON. No Play Developer account, no API key.

```bash
npx play-reviews-cli com.instagram.android 200
npx play-reviews-cli "https://play.google.com/store/apps/details?id=com.spotify.music" 50 --json
```

Args: `<package-or-url>` `[maxReviews]` (default 100, newest first) `[--json]`. `hl=` and `gl=` in a Play link pick the review language and country (default `en`/`us`).

## How it works

Talks to the Play Store's internal reviews endpoint (the same anonymous RPC the web UI uses), pages through with the continuation token, and returns clean JSON. MIT.

## Output contract

Identical across every tool in this family, so they chain cleanly from shell scripts and AI agents:

- **stdout** is data only: the plain format above, or one JSON envelope with `--json`
- **stderr** is diagnostics only: errors, warnings, summaries
- **exit codes**

| code | meaning |
|---|---|
| `0` | complete |
| `1` | usage error or invalid input |
| `2` | the upstream source failed. If some results arrived first they're still on stdout, and the envelope says `"complete": false` |
| `3` | the source answered, but had no data for this input |

With `--json`, success is one line on stdout:

```json
{"tool":"play-reviews","version":"2.0.0","input":{...},"complete":true,"count":42,"results":[...]}
```

and a failure is one line on stderr:

```json
{"tool":"play-reviews","version":"2.0.0","exitCode":2,"error":{"type":"BLOCKED","message":"HTTP 429","retryable":true}}
```

Branch on the exit code; log `error.type`: `USAGE`, `INVALID_INPUT` and `INVALID_REQUEST` (the source rejected the input) exit `1`; `NETWORK`, `BLOCKED` and `BAD_RESPONSE` (a captcha or consent page instead of data) exit `2` with `retryable` set; `NOT_FOUND` and `NO_DATA` exit `3`.

`--json --help` prints `{"tool","version","usage"}`. `--` ends option parsing, for inputs that start with a dash. Extra arguments are an error rather than silently dropped, so quote inputs that contain spaces.

## iOS too, or this on a schedule?

- **iOS**: [app-store-reviews-cli](https://github.com/inmanjeffrey89-cell/app-store-reviews-cli), same contract
- **Many apps, scheduled, structured**: the hosted [Google Play Reviews Scraper](https://apify.com/beacondata/google-play-reviews-scraper), pay per review, apps with no reviews free
- **A weekly email digest of both stores' reviews**: [ready-made n8n workflow](https://inmanjeffrey89-cell.github.io/data-tools/n8n-workflows)

## The family

Five no-key data CLIs, one output contract:
[yt-transcript-cli](https://github.com/inmanjeffrey89-cell/yt-transcript-cli) ·
[keyword-ideas-cli](https://github.com/inmanjeffrey89-cell/keyword-ideas-cli) ·
[gtrends-cli](https://github.com/inmanjeffrey89-cell/gtrends-cli) ·
[play-reviews-cli](https://github.com/inmanjeffrey89-cell/play-reviews-cli) ·
[app-store-reviews-cli](https://github.com/inmanjeffrey89-cell/app-store-reviews-cli)

## Changelog

**2.0.0** — shared output contract across the family: data on stdout, diagnostics on stderr, exit codes `0/1/2/3`, and a `--json` envelope. Breaking: "no data" now exits `3` (was `2`), and network failures are reported instead of being swallowed. Network failures now exit `2` with a typed error instead of a stack trace; an app with no reviews exits `3` instead of printing `[]`; `hl=`/`gl=` in a Play link are honored; a link with an invalid id is rejected instead of being truncated to a different app. Thanks to u/Tariq9977 on r/SideProject for the suggestion.

## License

MIT
