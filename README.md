# Authly REST API Authentication Demo

A simple Express.js signup and login system backed by a JavaScript JSON-style array. The frontend uses Tailwind CSS via its CDN build.

## Run

```bash
bun install
bun run dev
```

Open <http://localhost:3000> in a browser.

## API

| Method | Endpoint | Success | Validation |
| --- | --- | --- | --- |
| POST | `/api/signup` | `201` | `400` for empty fields, `409` for an existing email/username |
| POST | `/api/login` | `200` | `400` for empty fields, `401` for invalid credentials |

Signup expects `email`, `username`, and `password` in a JSON request body. Login expects `username` and `password` in the JSON request body. Users are stored in `users.js` for the lifetime of the server process.
