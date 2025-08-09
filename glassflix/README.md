# GlassFlix (Static HTML/CSS/JS)

A fast, glassy TMDB + VidSrc streaming UI built for Firebase Hosting.

## Setup
1. Copy `scripts/config.example.js` to `scripts/config.js` and set your TMDB v3 API key (or v4 read token):

```js
export const TMDB_API_KEY = "YOUR_V3_KEY"; // if not using v4
export const TMDB_V4_TOKEN = "";           // optional; if set, Authorization header is used
```

2. Serve locally (any static server) or deploy to Firebase Hosting.

## Firebase Hosting
```
firebase init hosting  # choose existing project or create one
firebase deploy
```

## Features
- Glassmorphism UI, animations, and responsive layout
- TMDB browse/search, details, cast, and recommendations (VidSrc embed)
- VidSrc.xyz embedded player (sandboxed to block popups)
- Watchlist via localStorage
- Caching: API TTL cache + SW image caching
- Lazy-loaded images, content-visibility, and preconnects
- Theme toggle (light/dark)

Note: API keys in client apps are visible to users. Restrict the key in TMDB settings.