# Blog Platform Midterm

Two Express servers implementing JWT authentication, role-based authorization, and localStorage-compatible persistence.

## Setup

From `blog-platform`:

```bash
bun install
```

Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.

## Run

Use two terminals:

```bash
npm run auth
```

```bash
npm run blog
```

- Auth Server: http://localhost:4000
- Blog API and website: http://localhost:5000

## Endpoints

Auth server: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`

Blog API: `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`, `GET /api/me/posts`

Access tokens contain `{ id, username, role }` and expire after 15 minutes. Refresh tokens contain `type: "refresh"` and expire after 7 days.
