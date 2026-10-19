# Blog Ninja Midterm Exam

Two Express servers with JWT authentication, role-based authorization, and localStorage-compatible persistence.

## Servers

- Auth Server: `http://localhost:4000`
- Blog API and website: `http://localhost:5000`

## Run

From this directory:

```bash
bun install
bun run auth
```

In a second terminal:

```bash
bun run blog
```

Then open `http://localhost:5000`.

Copy `.env.example` to `.env` and set a strong `JWT_SECRET` before submission. The shared `.env` is loaded by both servers using an explicit dotenv path.

## Roles

- `reader`: read posts and view personal posts
- `author`: create posts and update owned posts
- `admin`: create, update, and delete posts

User and post arrays are loaded from and saved to localStorage-compatible storage under `data/`. The data directory is ignored by Git.

## API summary

### Auth Server

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`

### Blog API

- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `GET /api/me/posts`
