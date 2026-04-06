const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 5001;

const dbPath = path.join(__dirname, "quiz_scores.sqlite");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// db.prepare("UPDATE users SET role = 'admin' WHERE username = 'adminTester'").run();

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const cols = db.prepare("PRAGMA table_info(scores)").all();
if (
  cols.length > 0 &&
  !cols.some((c) => c.name === "timestamp") &&
  cols.some((c) => c.name === "created_at")
) {
  db.exec("ALTER TABLE scores RENAME COLUMN created_at TO timestamp");
}

if (cols.length > 0 && !cols.some((c) => c.name === "user_id")) {
  db.exec("ALTER TABLE scores ADD COLUMN user_id INTEGER");
}

try {
  db.prepare(`
    UPDATE scores
    SET user_id = (SELECT id FROM users WHERE users.username = scores.username)
    WHERE user_id IS NULL
  `).run();
} catch (e) {}

app.use(cors());
app.use(bodyParser.json({ limit: "32kb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

function sanitizeUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, email: row.email, role: row.role };
}

function isAdmin(options = {}) {
  const { redirectTo = "/index.html" } = options;

  return (req, res, next) => {
    const userId = req.session?.userId;
    if (!userId) {
      if (req.accepts("html")) return res.redirect("/login.html");
      return res.status(401).json({ error: "not_logged_in" });
    }

    const row = db
      .prepare("SELECT role FROM users WHERE id = ?")
      .get(Number(userId));

    const role = String(row?.role || "").toLowerCase();
    if (role !== "admin") {
      if (req.accepts("html")) return res.redirect(redirectTo);
      return res.status(403).json({ error: "forbidden" });
    }

    return next();
  };
}

app.post("/api/register", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (username.length < 4) return res.status(400).json({ error: "username_too_short" });
  if (!email || !email.includes("@")) return res.status(400).json({ error: "invalid_email" });
  if (password.length < 8) return res.status(400).json({ error: "password_too_short" });

  const exists = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (exists) return res.status(409).json({ error: "user_exists" });

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)")
    .run(username, email, passwordHash);

  req.session.userId = Number(result.lastInsertRowid);
  const user = db
    .prepare("SELECT id, username, email, role FROM users WHERE id = ?")
    .get(req.session.userId);
  res.json({ ok: true, user: sanitizeUser(user) });
});

app.post("/api/login", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) return res.status(400).json({ error: "missing_credentials" });

  const row = db
    .prepare("SELECT id, username, email, role, password_hash FROM users WHERE username = ?")
    .get(username);
  if (!row) return res.status(401).json({ error: "invalid_credentials" });

  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  req.session.userId = row.id;
  res.json({ ok: true, user: sanitizeUser(row) });
});

app.get("/api/me", (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "not_logged_in" });
  const row = db
    .prepare("SELECT id, username, email, role FROM users WHERE id = ?")
    .get(Number(userId));
  if (!row) return res.status(401).json({ error: "not_logged_in" });
  res.json({ user: sanitizeUser(row) });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.post("/api/save-score", (req, res) => {
  const { username, score } = req.body || {};

  const scoreNum = Number(score);
  if (!Number.isFinite(scoreNum)) {
    return res.status(400).json({ error: "score must be a number" });
  }

  // Link to logged-in user if present; otherwise allow legacy username payloads
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;
  const bodyUsername = typeof username === "string" ? username.trim() : "";

  let finalUsername = "";
  let finalUserId = null;

  if (sessionUserId) {
    const u = db.prepare("SELECT id, username FROM users WHERE id = ?").get(sessionUserId);
    if (u) {
      finalUserId = u.id;
      finalUsername = u.username;
    }
  } else if (bodyUsername) {
    finalUsername = bodyUsername;
    const u = db.prepare("SELECT id FROM users WHERE username = ?").get(finalUsername);
    if (u) finalUserId = u.id;
  }

  if (!finalUsername) return res.status(400).json({ error: "username is required" });

  const stmt = db.prepare(
    "INSERT INTO scores (user_id, username, score) VALUES (?, ?, ?)"
  );
  const result = stmt.run(finalUserId, finalUsername, Math.round(scoreNum));

  res.json({ ok: true, id: Number(result.lastInsertRowid) });
});

// Protect direct access to admin page (served before express.static)
app.get("/admin.html", isAdmin({ redirectTo: "/index.html" }), (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Protect any admin APIs under /api/admin/*
app.use("/api/admin", isAdmin(), (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`quizWeb server at http://localhost:${PORT}`);
});
