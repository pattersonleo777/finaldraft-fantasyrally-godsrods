Deployment and Stripe setup

Server (Express + SQLite)

- Required environment variables:
  - `JWT_SECRET` — secret for signing JWTs (set to a secure value in production)
  - `STRIPE_SECRET_KEY` — your Stripe secret key (starts with `sk_...`)
  - `STRIPE_WEBHOOK_SECRET` — (optional) webhook signing secret for secure webhook verification
  - `SUCCESS_URL` — URL to redirect after successful Checkout (defaults to `http://localhost:3000/?success=1`)
  - `CANCEL_URL` — URL to redirect after cancelled Checkout (defaults to `http://localhost:3000/?canceled=1`)

- Install dependencies and run locally:

```bash
cd webapp/fantasyrally/server
npm install
npm start
```

- Webhook testing locally: use the Stripe CLI to forward events to `http://localhost:4000/webhook` and set `STRIPE_WEBHOOK_SECRET`.

Frontend (Vite React)

- Install and run:

```bash
cd webapp/fantasyrally/mobile-app
npm install
npm run dev
```

- The frontend uses the server endpoints to sign up, sign in, and create Stripe Checkout sessions. It redirects users to Stripe Checkout for card payments.

Production deployment

- Frontend: deploy `webapp/fantasyrally/mobile-app` to Vercel (or Netlify). Set `VITE_API_URL` if needed. Default server API is `http://localhost:4000` — update to your server URL in `App.jsx`.
- Backend: deploy `webapp/fantasyrally/server` to Render, Heroku, or similar. Set environment variables listed above.
 
Minimal local deployment steps

- Copy the example env and fill secrets (do NOT commit `.env`):

```bash
cp webapp/fantasyrally/.env.example webapp/fantasyrally/.env
# edit webapp/fantasyrally/.env and add your keys
```

- Run the minimal helper script (starts backend + frontend):

```bash
./webapp/fantasyrally/run-local.sh
```

Production notes

- Set runtime environment variables in your host's dashboard (recommended):
  - Vercel: set `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_API_URL` for the frontend
  - Render / Heroku: set `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUCCESS_URL`, and `CANCEL_URL` for the backend

Do NOT store secret keys in the repository. Use the hosting provider's environment settings or GitHub Actions secrets (only if workflows require them).

Mobile (phone/tablet) usage

- Development (fast, use your device on the same LAN): run the Vite dev server bound to all interfaces and open the dev URL on your mobile browser:

```bash
cd webapp/fantasyrally/mobile-app
npm install   # run once on a machine with npm access
npm run dev -- --host 0.0.0.0
# open http://<your-machine-ip>:5173 on your phone
```

- Production (static build served by any static host or wrapped as a mobile app):

```bash
cd webapp/fantasyrally/mobile-app
npm run build
# serve the `dist/` folder with a static server (or deploy to Vercel/Netlify)
# to create a native wrapper, consider Capacitor (optional):
npx @capacitor/cli create app com.example.fantasyrally "FantasyRally"
npx cap init
npm run build && npx cap add android && npx cap open android
```

The frontend shipped here is a web app that can run in mobile browsers or be wrapped as a native app; choose the path that fits your release plan.

Docker / 24/7 run (minimal)

To run the backend and frontend continuously on a single host with Docker:

```bash
# from repository root
docker compose build
docker compose up -d
```

- The web UI will be available on port 80. The admin portal will be available at `/admin` (for example: `http://your-host/admin`).
- The backend listens on port 4000 and is reachable internally by the frontend at `http://api:4000`.
- To stop: `docker compose down`

Make sure to provide environment variables to the `api` service (via a `.env` file or your host's secrets manager). Example `.env` values are in `webapp/fantasyrally/.env.example`.

GitHub Pages + custom domain (minimal frontend hosting)

This project can host the frontend on GitHub Pages and serve the admin at `/admin`.

1. Push your `main` branch to GitHub. A workflow (`.github/workflows/deploy-frontend.yml`) will build `webapp/fantasyrally/mobile-app` and publish to the `gh-pages` branch.
2. In your repo Settings → Pages, set the Source to the `gh-pages` branch (root). GitHub will serve the site at `https://<your-github-username>.github.io/<repo>/` or, with a custom domain below, at your domain.
3. To use your apex domain `godsrods.online`, configure your DNS:
   - Add A records for the apex pointing to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - (Optional) To use `www.godsrods.online`, add a CNAME record pointing `www` → `<your-github-username>.github.io`.
4. Once DNS has propagated, the site will be available at `https://godsrods.online`.

Notes:
- The workflow writes a `CNAME` file into the built `dist` so Pages serves `godsrods.online`.
- Backend still needs hosting (Render/Heroku/other). Configure the API URL in the frontend as `VITE_API_URL` (in `webapp/fantasyrally/.env.example`) to point to your deployed API.
Notes and limitations

- Deposit flow: payments via Stripe Checkout credit users' `sweepcoins` balance based on the paid amount. Conversion implemented: 1 cent => 1 sweepcoin (so $1 => 100 sweepcoins).
- Withdrawal (swap back to cash): requires Stripe Connect and payouts to user bank accounts and KYC. This repo does not implement withdrawals. I can add a Connect-based solution if you want to support payouts.
