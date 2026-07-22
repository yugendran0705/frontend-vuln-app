# Bookshelf — Broken Authorization Demo

A small CRUD app (Express + JSON-file "database" + plain HTML/JS frontend)
built to demonstrate **broken access control** (OWASP A01:2021): a user can
escalate from `user` to `admin` just by editing `localStorage` in devtools.

This is intentionally vulnerable. Use it for training/demos only.

## Run it

```
npm install
npm run seed   # (re)generates server/data/users.json and books.json
npm start
```

Open http://localhost:4000

Seeded accounts:

| username | password  | role  |
|----------|-----------|-------|
| admin    | Admin@123 | admin |
| bob      | Bob@123   | user  |
| carol    | Carol@123 | user  |

## Data model

- `server/data/users.json` — `{ id, username, password (bcrypt hash), role, name }`
- `server/data/books.json` — `{ id, title, author, year, userId }`, where `userId` is a foreign key into users.json.

## The vulnerability

On login (`POST /api/auth/login`), the backend issues a session token
(`server/index.js`, `sessions` map) and returns the user's real `role` from
the database. The frontend stores `token`, `role`, `userId`, etc. in
`localStorage` (`public/js/login.js`).

Every subsequent request (`public/js/api.js`) sends:
- `Authorization: Bearer <token>`
- `X-Role: <role from localStorage>`

The `authenticate` middleware (`server/index.js`) correctly resolves the
token to a real user record and attaches the **true** role as `req.user.role`.

But the admin-only route (`GET /api/admin/users`) is guarded by
`requireAdminUNSAFE`, which checks `req.headers['x-role'] === 'admin'`
instead of `req.user.role === 'admin'`. It trusts a header the client fully
controls, ignoring the authenticated user record it already has.

## Exploiting it

1. Log in as `bob` (a plain `user`).
2. Open devtools → Application → Local Storage, and run:
   ```js
   localStorage.setItem('role', 'admin')
   ```
3. Navigate to `/admin.html` (or just reload the dashboard — the "Go to
   Admin Panel" link appears once `role` says `admin`).
4. The admin API call now sends `X-Role: admin` and returns every user's
   details and books — despite bob's database record still being `role:
   "user"`.

## The fix

Delete `requireAdminUNSAFE` and check `req.user.role` (the value looked up
server-side from the session/DB in `authenticate`) instead of any
client-supplied header:

```js
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin role required" });
  next();
}
```

Never let a client tell the server what role it has — authorization
decisions must be derived from server-side state (session, DB lookup, or a
properly *signed and verified* token claim), never from a request
header/body the client can edit.
