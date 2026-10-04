# play-reviews

Fetch **Google Play Store reviews** for any Android app from the command line — rating, text, version, author, date — as JSON. No Google Play Developer account, no API key.

```bash
node play-reviews.mjs com.instagram.android 200
node play-reviews.mjs "https://play.google.com/store/apps/details?id=com.spotify.music" 50
```

## How it works

Talks to the Play Store's internal reviews endpoint, pages through with the continuation token, and returns clean JSON. MIT.

## Need iOS too, or this at scale?

For **thousands of reviews, scheduled runs, and structured output** (and to monitor many apps at once), I run a hosted version on Apify — pay per review, apps with no reviews free:

**→ [Google Play Reviews Scraper](https://apify.com/beacondata/google-play-reviews-scraper)**

## License
MIT.
