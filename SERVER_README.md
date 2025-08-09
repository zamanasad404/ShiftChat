
# ShiftStrong — AI Message Backend (Cloudflare & Vercel)

**Cloudflare Workers (recommended)**
1. Install wrangler: `npm i -g wrangler`
2. `cd server/cloudflare`
3. `wrangler secret put OPENAI_API_KEY`
4. `wrangler deploy`
5. Copy URL (e.g., `https://shiftstrong-message.YOUR.workers.dev/message`)
6. In the PWA, set:
   - Browser console: `localStorage.setItem('shiftstrong_backend','YOUR_URL')`
   - Or edit `BACKEND_URL` in `app.js`.

**Vercel Serverless**
1. Put `server/vercel` into a Vercel project (so `api/message.js` is at `/api/message`).
2. Set env var `OPENAI_API_KEY` in Vercel.
3. Deploy; use `https://YOUR-APP.vercel.app/api/message` as BACKEND_URL.

**Endpoint**
POST JSON: `{ "profile": {{...}}, "messageType": "morning|midshift|winddown" }`
Returns: `{ "message": "..." }`

Messages are capped < 90 words and avoid medical claims.
