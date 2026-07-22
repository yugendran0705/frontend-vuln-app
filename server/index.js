const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const store = require("./lib/store");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// In-memory session store: token -> userId. Proves a request carries SOME
// valid, server-issued session (this part of auth is fine).
const sessions = {};

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const userId = token && sessions[token];
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const user = store.getUsers().find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  req.user = { id: user.id, username: user.username, role: user.role, name: user.name };
  next();
}

// --- VULNERABILITY: Broken Access Control (OWASP A01:2021) ---
// This check trusts the client-supplied "X-Role" header instead of using
// req.user.role, which was just looked up from the real database record in
// `authenticate` above. The frontend sends X-Role straight from
// localStorage, so any user can open devtools, run
// localStorage.setItem('role', 'admin'), and this middleware will grant
// admin access even though their real DB record still says role: "user".
// A correct fix would ignore the header entirely and check req.user.role.
function requireAdminUNSAFE(req, res, next) {
  if (req.headers["x-role"] !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}
// --- end vulnerability ---

// ---------- Auth ----------

app.post("/api/auth/register", (req, res) => {
  const { username, password, name } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const users = store.getUsers();
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const newUser = {
    id: uuidv4(),
    username,
    password: bcrypt.hashSync(password, 10),
    role: "user", // registration always creates a plain user; only the seeded admin has role "admin"
    name: name || username,
  };
  users.push(newUser);
  store.saveUsers(users);

  res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = store.getUsers().find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password || "", user.password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = uuidv4();
  sessions[token] = user.id;

  res.json({
    token,
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  });
});

app.post("/api/auth/logout", authenticate, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.slice(7);
  delete sessions[token];
  res.json({ ok: true });
});

// ---------- Books (own data only, correctly scoped by req.user.id) ----------

app.get("/api/books", authenticate, (req, res) => {
  const books = store.getBooks().filter((b) => b.userId === req.user.id);
  res.json(books);
});

app.post("/api/books", authenticate, (req, res) => {
  const { title, author, year } = req.body || {};
  if (!title || !author) return res.status(400).json({ error: "title and author are required" });

  const books = store.getBooks();
  const newBook = { id: uuidv4(), title, author, year: year || null, userId: req.user.id };
  books.push(newBook);
  store.saveBooks(books);
  res.status(201).json(newBook);
});

app.put("/api/books/:id", authenticate, (req, res) => {
  const books = store.getBooks();
  const book = books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (book.userId !== req.user.id) return res.status(403).json({ error: "Not your book" });

  const { title, author, year } = req.body || {};
  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (year !== undefined) book.year = year;
  store.saveBooks(books);
  res.json(book);
});

app.delete("/api/books/:id", authenticate, (req, res) => {
  const books = store.getBooks();
  const book = books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (book.userId !== req.user.id) return res.status(403).json({ error: "Not your book" });

  store.saveBooks(books.filter((b) => b.id !== req.params.id));
  res.json({ ok: true });
});

// ---------- Admin (intentionally broken authorization) ----------

app.get("/api/admin/users", authenticate, requireAdminUNSAFE, (req, res) => {
  const users = store.getUsers().map(({ password, ...safe }) => safe);
  const books = store.getBooks();
  const usersWithBooks = users.map((u) => ({
    ...u,
    books: books.filter((b) => b.userId === u.id),
  }));
  res.json(usersWithBooks);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
