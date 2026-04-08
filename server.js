const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables are created in Supabase dashboard - no need to create them here

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}

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
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status
  };
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

    // Use async IIFE to handle async operations in middleware
    (async () => {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', Number(userId))
          .single();

        if (error || !user) {
          if (log) {
            console.log(`[isAdmin] user_not_found path=${req.path} method=${req.method} userId=${Number(userId)}`);
          }
          return res.status(401).json({ error: "not_logged_in" });
        }

        const role = String(user.role || "").toLowerCase();
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
      } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ error: "server_error" });
      }
    })();
  };
}

app.post("/api/register", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (username.length < 4) return res.status(400).json({ error: "username_too_short" });
  if (!email || !email.includes("@")) return res.status(400).json({ error: "invalid_email" });
  if (password.length < 8) return res.status(400).json({ error: "password_too_short" });

  // Check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    return res.status(500).json({ error: "database_error" });
  }
  if (existingUser) return res.status(409).json({ error: "user_exists" });

  const passwordHash = bcrypt.hashSync(password, 10);
  
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      username,
      email,
      password_hash: passwordHash,
      role: 'user',
      status: 'active'
    })
    .select('id, username, email, role, status')
    .single();

  if (insertError || !newUser) {
    return res.status(500).json({ error: "registration_failed" });
  }

  req.session.userId = newUser.id;
  res.json({ ok: true, user: sanitizeUser(newUser) });
});

app.post("/api/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) return res.status(400).json({ error: "missing_credentials" });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, role, password_hash')
    .eq('username', username)
    .single();

  if (error || !user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  req.session.userId = user.id;
  res.json({ ok: true, user: sanitizeUser(user) });
});

app.get("/api/me", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "not_logged_in" });
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, role, status')
    .eq('id', Number(userId))
    .single();
  
  if (error || !user) return res.status(401).json({ error: "not_logged_in" });
  res.json({ user: sanitizeUser(user) });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* =====================
   ADMIN APIs (Supabase)
===================== */
app.get("/api/admin/stats", isAdmin({ log: true }), async (req, res) => {
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalAdmins } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');
  
  const { count: totalQuizzes } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true });
  
  const { count: hiddenQuizzes } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('hidden', true);

  res.json({ 
    totalUsers: totalUsers || 0, 
    totalAdmins: totalAdmins || 0, 
    totalQuizzes: totalQuizzes || 0, 
    hiddenQuizzes: hiddenQuizzes || 0 
  });
});

app.get("/api/admin/users", isAdmin({ log: true }), async (req, res) => {
  const { data: rows, error } = await supabase
    .from('users')
    .select('id, username, email, role, status, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    return res.status(500).json({ error: "database_error" });
  }
  
  res.json({ users: rows.map(sanitizeUser) });
});

app.post("/api/admin/users/:id/role", isAdmin({ log: true }), async (req, res) => {
  const id = Number(req.params?.id);
  const roleRaw = String(req.body?.role || "").trim().toLowerCase();
  const role = roleRaw === "admin" ? "admin" : "user";
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "invalid_user_id" });

  const { data: exists, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (checkError || !exists) return res.status(404).json({ error: "not_found" });

  const { error: updateError } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id);
  
  if (updateError) {
    return res.status(500).json({ error: "update_failed" });
  }
  
  res.json({ ok: true });
});

app.post("/api/admin/users/:id/status", isAdmin({ log: true }), async (req, res) => {
  const id = Number(req.params?.id);
  const statusRaw = String(req.body?.status || "").trim().toLowerCase();
  const status = statusRaw === "inactive" ? "inactive" : "active";
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "invalid_user_id" });

  const { data: exists, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (checkError || !exists) return res.status(404).json({ error: "not_found" });

  const { error: updateError } = await supabase
    .from('users')
    .update({ status })
    .eq('id', id);
  
  if (updateError) {
    return res.status(500).json({ error: "update_failed" });
  }
  
  res.json({ ok: true });
});

app.delete("/api/admin/users/:id", isAdmin({ log: true }), async (req, res) => {
  const id = Number(req.params?.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "invalid_user_id" });

  // Prevent deleting yourself
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;
  if (sessionUserId && id === sessionUserId) {
    return res.status(400).json({ error: "cannot_delete_self" });
  }

  const { data: exists, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (checkError || !exists) return res.status(404).json({ error: "not_found" });

  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  
  if (deleteError) {
    return res.status(500).json({ error: "delete_failed" });
  }
  
  res.json({ ok: true });
});

app.get("/api/admin/quizzes", isAdmin({ log: true }), async (req, res) => {
  const { data: rows, error } = await supabase
    .from('quizzes')
    .select('id, code, title, created_by, hidden, created_at, data_json, users!inner(username)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: "database_error" });
  }

  const quizzes = rows.map((r) => {
    const data = safeJsonParse(r.data_json, {});
    return {
      id: r.id,
      code: r.code,
      title: r.title,
      created_by: r.created_by,
      created_by_username: r.users?.username || null,
      hidden: r.hidden ? 1 : 0,
      created_at: r.created_at,
      data
    };
  });

  res.json({ quizzes });
});

app.post("/api/admin/quizzes/:id/hidden", isAdmin({ log: true }), async (req, res) => {
  const id = Number(req.params?.id);
  const hidden = req.body?.hidden ? true : false;
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "invalid_quiz_id" });

  const { data: exists, error: checkError } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (checkError || !exists) return res.status(404).json({ error: "not_found" });

  const { error: updateError } = await supabase
    .from('quizzes')
    .update({ hidden })
    .eq('id', id);
  
  if (updateError) {
    return res.status(500).json({ error: "update_failed" });
  }
  
  res.json({ ok: true });
});

app.delete("/api/admin/quizzes/:id", isAdmin({ log: true }), async (req, res) => {
  const id = Number(req.params?.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "invalid_quiz_id" });

  const { data: exists, error: checkError } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (checkError || !exists) return res.status(404).json({ error: "not_found" });

  const { error: deleteError } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', id);
  
  if (deleteError) {
    return res.status(500).json({ error: "delete_failed" });
  }
  
  res.json({ ok: true });
});

app.post("/api/save-score", async (req, res) => {
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
    const { data: u, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', sessionUserId)
      .single();
    
    if (!error && u) {
      finalUserId = u.id;
      finalUsername = u.username;
    }
  } else if (bodyUsername) {
    finalUsername = bodyUsername;
    const { data: u, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', finalUsername)
      .maybeSingle();
    
    if (!error && u) finalUserId = u.id;
  }

  if (!finalUsername) return res.status(400).json({ error: "username is required" });

  const { data: result, error: insertError } = await supabase
    .from('scores')
    .insert({
      user_id: finalUserId,
      username: finalUsername,
      score: Math.round(scoreNum)
    })
    .select('id')
    .single();

  if (insertError || !result) {
    return res.status(500).json({ error: "score_save_failed" });
  }

  res.json({ ok: true, id: result.id });
});

app.post("/api/save-quiz", async (req, res) => {
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;
  if (!sessionUserId) return res.status(401).json({ error: "not_logged_in" });

  const quiz = req.body?.quiz;
  const code = String(quiz?.code || "").trim();
  const title = String(quiz?.title || "").trim();

  if (!code) return res.status(400).json({ error: "missing_code" });
  if (!title) return res.status(400).json({ error: "missing_title" });

  // Check existing quiz
  const { data: existing, error: existingError } = await supabase
    .from('quizzes')
    .select('id, created_by')
    .eq('code', code)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: "database_error" });
  }

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

  let result;
  if (existing) {
    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update({ title, data_json: dataJson })
      .eq('code', code)
      .select('code, title, created_by, created_at')
      .single();
    
    if (updateError || !updatedQuiz) {
      return res.status(500).json({ error: "update_failed" });
    }
    result = updatedQuiz;
  } else {
    const { data: newQuiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        code,
        title,
        data_json: dataJson,
        created_by: sessionUserId
      })
      .select('code, title, created_by, created_at')
      .single();
    
    if (insertError || !newQuiz) {
      return res.status(500).json({ error: "insert_failed" });
    }
    result = newQuiz;
  }

  // Get username for created_by_user
  const { data: userData } = await supabase
    .from('users')
    .select('username')
    .eq('id', result.created_by)
    .single();

  const quizWithUsername = {
    ...result,
    created_by_username: userData?.username || null
  };

  res.json({ ok: true, quiz: quizWithUsername });
});

app.get("/api/quizzes", async (req, res) => {
  const mine = String(req.query?.mine || "").trim() === "1";
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;

  let query = supabase
    .from('quizzes')
    .select('code, title, data_json, created_by, created_at, users!inner(username)')
    .order('created_at', { ascending: false });

  if (mine) {
    if (!sessionUserId) return res.status(401).json({ error: "not_logged_in" });
    query = query.eq('created_by', sessionUserId);
  }

  const { data: rows, error } = await query;
  
  if (error) {
    return res.status(500).json({ error: "database_error" });
  }

  const quizzes = rows.map((r) => {
    const data = safeJsonParse(r.data_json, {});
    return {
      code: r.code,
      title: r.title,
      created_by: r.created_by,
      created_by_username: r.users?.username || null,
      created_at: r.created_at,
      data
    };
  });

  res.json({ quizzes });
});

app.get("/api/quiz/:code", async (req, res) => {
  const code = String(req.params?.code || "").trim();
  if (!code) return res.status(400).json({ error: "missing_code" });

  const { data: row, error } = await supabase
    .from('quizzes')
    .select('code, title, data_json, created_by, created_at, users!inner(username)')
    .eq('code', code)
    .single();

  if (error || !row) return res.status(404).json({ error: "not_found" });
  const data = safeJsonParse(row.data_json, null);
  if (!data) return res.status(500).json({ error: "invalid_quiz_data" });

  res.json({
    quiz: {
      code: row.code,
      title: row.title,
      created_by: row.created_by,
      created_by_username: row.users?.username || null,
      created_at: row.created_at,
      data
    }
  });
});

app.delete("/api/quiz/:code", async (req, res) => {
  const sessionUserId = req.session?.userId ? Number(req.session.userId) : null;
  if (!sessionUserId) return res.status(401).json({ error: "not_logged_in" });

  const code = String(req.params?.code || "").trim();
  if (!code) return res.status(400).json({ error: "missing_code" });

  const { data: row, error: fetchError } = await supabase
    .from('quizzes')
    .select('created_by')
    .eq('code', code)
    .single();

  if (fetchError || !row) return res.status(404).json({ error: "not_found" });
  if (Number(row.created_by) !== sessionUserId) return res.status(403).json({ error: "forbidden" });

  const { error: deleteError } = await supabase
    .from('quizzes')
    .delete()
    .eq('code', code);

  if (deleteError) {
    return res.status(500).json({ error: "delete_failed" });
  }

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
// (Handled explicitly above)

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`quizWeb server at http://localhost:${PORT}`);
});
