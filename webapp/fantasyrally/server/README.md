# FantasyRally Server

Install and run:

```bash
cd webapp/fantasyrally/server
npm install
npm start
```

Server listens on `http://localhost:4000` and exposes:

- `POST /api/upload` (form-data `file`, optional `title`)
- `GET /api/content` (list metadata)
- `GET /content/:filename` (static files)
