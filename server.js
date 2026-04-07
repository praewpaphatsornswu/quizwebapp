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

db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}

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
app.use(bodyParser.json({ limit: "512kb" }));
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
  const {
    redirectTo = "/index.html",
    loginRedirectTo = "/login.html",
    log = true,
    forceHtmlRedirect = false
  } = options;

  return (req, res, next) => {
    const userId = req.session?.userId;
    if (!userId) {
      if (log) {
        console.log(`[isAdmin] not_logged_in path=${req.path} method=${req.method}`);
      }
      if (forceHtmlRedirect || req.accepts("html")) return res.redirect(loginRedirectTo);
      return res.status(401).json({ error: "not_logged_in" });
    }

    const row = db
      .prepare("SELECT role FROM users WHERE id = ?")
      .get(Number(userId));

    const role = String(row?.role || "").toLowerCase();
    if (log) {
      console.log(
        `[isAdmin] path=${req.path} method=${req.method} userId=${Number(userId)} role=${role || "(none)"}`
      );
    }
    if (role !== "admin") {
      if (forceHtmlRedirect || req.accepts("html")) return res.redirect(redirectTo);
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

app.post("/api/save-quiz", (req, res) => {
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;
  if (!sessionUserId) return res.status(401).json({ error: "not_logged_in" });

  const quiz = req.body?.quiz;
  const code = String(quiz?.code || "").trim();
  const title = String(quiz?.title || "").trim();

  if (!code) return res.status(400).json({ error: "missing_code" });
  if (!title) return res.status(400).json({ error: "missing_title" });

  const existing = db
    .prepare("SELECT id, created_by FROM quizzes WHERE code = ?")
    .get(code);

  if (existing && Number(existing.created_by) !== sessionUserId) {
    return res.status(403).json({ error: "forbidden" });
  }

  // Ensure we always persist the full quiz object (questions/options/timing/settings)
  const payload = {
    ...quiz,
    code,
    title,
    owner: quiz?.owner || undefined
  };
  const dataJson = JSON.stringify(payload);

  if (existing) {
    db.prepare(
      "UPDATE quizzes SET title = ?, data_json = ? WHERE code = ?"
    ).run(title, dataJson, code);
  } else {
    db.prepare(
      "INSERT INTO quizzes (code, title, data_json, created_by) VALUES (?, ?, ?, ?)"
    ).run(code, title, dataJson, sessionUserId);
  }

  const row = db
    .prepare(
      `SELECT q.code, q.title, q.created_by, q.created_at, u.username AS created_by_username
       FROM quizzes q
       LEFT JOIN users u ON u.id = q.created_by
       WHERE q.code = ?`
    )
    .get(code);

  res.json({ ok: true, quiz: row });
});

app.get("/api/quizzes", (req, res) => {
  const mine = String(req.query?.mine || "").trim() === "1";
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;

  let rows = [];
  if (mine) {
    if (!sessionUserId) return res.status(401).json({ error: "not_logged_in" });
    rows = db
      .prepare(
        `SELECT q.code, q.title, q.data_json, q.created_by, q.created_at,
                u.username AS created_by_username
         FROM quizzes q
         LEFT JOIN users u ON u.id = q.created_by
         WHERE q.created_by = ?
         ORDER BY q.created_at DESC`
      )
      .all(sessionUserId);
  } else {
    rows = db
      .prepare(
        `SELECT q.code, q.title, q.data_json, q.created_by, q.created_at,
                u.username AS created_by_username
         FROM quizzes q
         LEFT JOIN users u ON u.id = q.created_by
         ORDER BY q.created_at DESC`
      )
      .all();
  }

  const quizzes = rows.map((r) => {
    const data = safeJsonParse(r.data_json, {});
    return {
      code: r.code,
      title: r.title,
      created_by: r.created_by,
      created_by_username: r.created_by_username,
      created_at: r.created_at,
      data
    };
  });

  res.json({ quizzes });
});

app.get("/api/quiz/:code", (req, res) => {
  const code = String(req.params?.code || "").trim();
  if (!code) return res.status(400).json({ error: "missing_code" });

  const row = db
    .prepare(
      `SELECT q.code, q.title, q.data_json, q.created_by, q.created_at,
              u.username AS created_by_username
       FROM quizzes q
       LEFT JOIN users u ON u.id = q.created_by
       WHERE q.code = ?`
    )
    .get(code);

  if (!row) return res.status(404).json({ error: "not_found" });
  const data = safeJsonParse(row.data_json, null);
  if (!data) return res.status(500).json({ error: "invalid_quiz_data" });

  res.json({
    quiz: {
      code: row.code,
      title: row.title,
      created_by: row.created_by,
      created_by_username: row.created_by_username,
      created_at: row.created_at,
      data
    }
  });
});

app.delete("/api/quiz/:code", (req, res) => {
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;
  if (!sessionUserId) return res.status(401).json({ error: "not_logged_in" });

  const code = String(req.params?.code || "").trim();
  if (!code) return res.status(400).json({ error: "missing_code" });

  const row = db.prepare("SELECT created_by FROM quizzes WHERE code = ?").get(code);
  if (!row) return res.status(404).json({ error: "not_found" });
  if (Number(row.created_by) !== sessionUserId) return res.status(403).json({ error: "forbidden" });

  db.prepare("DELETE FROM quizzes WHERE code = ?").run(code);
  res.json({ ok: true });
});

// Protect direct access to admin page (served before express.static)
app.get(
  "/admin.html",
  isAdmin({ redirectTo: "/index.html", loginRedirectTo: "/index.html", forceHtmlRedirect: true, log: true }),
  (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
  }
);

// Protect any admin APIs under /api/admin/*
app.use("/api/admin", isAdmin(), (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`quizWeb server at http://localhost:${PORT}`);
});
