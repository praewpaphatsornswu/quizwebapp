let currentTab = "usersPanel";
let allUsers = [];
let allQuizzes = [];

async function apiJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || res.statusText || "request_failed");
  return body;
}

async function logoutAdmin() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (e) {}
  try {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
  } catch (e) {}
  window.location.href = "/index.html";
}

function normalizeUser(user, index) {
  return {
    id: user.id ?? index + 1,
    username: user.username || "ไม่มีชื่อ",
    email: user.email || "-",
    role: String(user.role || "user").toLowerCase(),
    status: String(user.status || "active").toLowerCase(),
    created_at: user.created_at || "-"
  };
}

function normalizeQuiz(quiz, index) {
  const q = quiz?.data || {};
  const questions = Array.isArray(q.questions) ? q.questions : [];
  const hidden = Number(quiz.hidden) ? 1 : 0;
  return {
    id: quiz.id ?? index + 1,
    title: quiz.title || q.title || "ไม่มีชื่อควิซ",
    code: quiz.code || q.code || "-",
    creatorId: quiz.created_by ?? null,
    creatorName: quiz.created_by_username || null,
    status: hidden ? "hidden" : "active",
    questions,
    created_at: quiz.created_at || "-"
  };
}

    function formatDate(value) {
      if (!value || value === "-") return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString("th-TH");
    }

    function getRoleTag(role) {
      if (role === "admin") return `<span class="tag admin">ADMIN</span>`;
      return `<span class="tag user">USER</span>`;
    }

    function getStatusTag(status) {
      const s = String(status || "").toLowerCase();
      if (s === "active") return `<span class="tag active">ACTIVE</span>`;
      if (s === "hidden") return `<span class="tag hidden">HIDDEN</span>`;
      if (s === "deleted") return `<span class="tag deleted">DELETED</span>`;
      if (s === "inactive") return `<span class="tag inactive">INACTIVE</span>`;
      if (s === "banned") return `<span class="tag banned">BANNED</span>`;
      return `<span class="tag user">${s || "UNKNOWN"}</span>`;
    }

function updateStatsFromServer(stats) {
  document.getElementById("totalUsers").textContent = String(stats?.totalUsers ?? 0);
  document.getElementById("totalQuizzes").textContent = String(stats?.totalQuizzes ?? 0);
  document.getElementById("hiddenQuizzes").textContent = String(stats?.hiddenQuizzes ?? 0);
  document.getElementById("totalAdmins").textContent = String(stats?.totalAdmins ?? 0);
}

    function renderUsers(users) {
      const tbody = document.getElementById("usersTableBody");

      if (!users.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">ยังไม่มีข้อมูลผู้ใช้</div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>
            <strong>${escapeHtml(user.username)}</strong>
          </td>
          <td>${escapeHtml(user.email)}</td>
          <td>${getRoleTag(user.role)}</td>
          <td>${getStatusTag(user.status)}</td>
          <td>${escapeHtml(formatDate(user.created_at))}</td>
          <td>
            <div class="action-group">
              ${
                user.role === "admin"
                  ? `<button class="small-btn warn" onclick="changeUserRole(${user.id}, 'user')">ลดเป็น User</button>`
                  : `<button class="small-btn primary" onclick="changeUserRole(${user.id}, 'admin')">ตั้งเป็น Admin</button>`
              }
              ${
                user.status === "active"
                  ? `<button class="small-btn warn" onclick="toggleUserStatus(${user.id}, 'inactive')">ระงับ</button>`
                  : `<button class="small-btn primary" onclick="toggleUserStatus(${user.id}, 'active')">เปิดใช้งาน</button>`
              }
              <button class="small-btn danger" onclick="deleteUser(${user.id})">ลบ</button>
            </div>
          </td>
        </tr>
      `).join("");
    }

    function findCreatorName(quiz) {
      if (quiz.creatorName) return quiz.creatorName;
      const creator = allUsers.find(u => String(u.id) === String(quiz.creatorId));
      return creator ? creator.username : "ไม่ทราบผู้สร้าง";
    }

    function renderQuizzes(quizzes) {
      const tbody = document.getElementById("quizzesTableBody");

      if (!quizzes.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">ยังไม่มีข้อมูลควิซ</div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = quizzes.map(quiz => `
        <tr>
          <td>${quiz.id}</td>
          <td>
            <strong>${escapeHtml(quiz.title)}</strong>
          </td>
          <td>${escapeHtml(quiz.code)}</td>
          <td>${escapeHtml(findCreatorName(quiz))}</td>
          <td>${getStatusTag(quiz.status)}</td>
          <td>${Array.isArray(quiz.questions) ? quiz.questions.length : 0}</td>
          <td>${escapeHtml(formatDate(quiz.created_at))}</td>
          <td>
            <div class="action-group">
              ${
                quiz.status === "hidden"
                  ? `<button class="small-btn primary" onclick="toggleQuizStatus(${quiz.id}, 'active')">แสดงกลับ</button>`
                  : `<button class="small-btn warn" onclick="toggleQuizStatus(${quiz.id}, 'hidden')">ซ่อนควิซ</button>`
              }
              <button class="small-btn danger" onclick="deleteQuiz(${quiz.id})">ลบควิซ</button>
            </div>
          </td>
        </tr>
      `).join("");
    }

async function refreshAll() {
  // Stats
  const stats = await apiJson("/api/admin/stats");
  updateStatsFromServer(stats);

  // Users
  const usersBody = await apiJson("/api/admin/users");
  allUsers = (Array.isArray(usersBody?.users) ? usersBody.users : []).map(normalizeUser);

  // Quizzes (for the Quizzes tab + hidden stats parity)
  const quizzesBody = await apiJson("/api/admin/quizzes");
  allQuizzes = (Array.isArray(quizzesBody?.quizzes) ? quizzesBody.quizzes : []).map(normalizeQuiz);

  handleSearch();
}

    function switchTab(tabId, btn) {
      currentTab = tabId;

      document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.remove("active");
      });
      document.getElementById(tabId).classList.add("active");

      document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.classList.remove("active");
      });
      btn.classList.add("active");

      handleSearch();
    }

    function handleSearch() {
      const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
      const filter = document.getElementById("filterSelect").value;

      if (currentTab === "usersPanel") {
        let filtered = [...allUsers];

        if (keyword) {
          filtered = filtered.filter(user =>
            String(user.id).includes(keyword) ||
            user.username.toLowerCase().includes(keyword) ||
            user.email.toLowerCase().includes(keyword)
          );
        }

        if (filter === "admin" || filter === "user") {
          filtered = filtered.filter(user => user.role === filter);
        }

        if (filter === "active") {
          filtered = filtered.filter(user => user.status === "active");
        }

        if (filter === "hidden") {
          filtered = filtered.filter(user => user.status === "inactive" || user.status === "banned");
        }

        renderUsers(filtered);
      } else {
        let filtered = [...allQuizzes];

        if (keyword) {
          filtered = filtered.filter(quiz =>
            String(quiz.id).includes(keyword) ||
            quiz.title.toLowerCase().includes(keyword) ||
            String(quiz.code).toLowerCase().includes(keyword) ||
            findCreatorName(quiz).toLowerCase().includes(keyword)
          );
        }

        if (filter === "active" || filter === "hidden") {
          filtered = filtered.filter(quiz => quiz.status === filter);
        }

        renderQuizzes(filtered);
      }
    }

async function changeUserRole(userId, newRole) {
  await apiJson(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: newRole })
  });
  await refreshAll();
}

async function toggleUserStatus(userId, newStatus) {
  await apiJson(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  });
  await refreshAll();
}

async function deleteUser(userId) {
  if (!confirm("ต้องการลบผู้ใช้นี้จริงหรือไม่?")) return;
  await apiJson(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
  await refreshAll();
}

async function toggleQuizStatus(quizId, newStatus) {
  const hidden = newStatus === "hidden";
  await apiJson(`/api/admin/quizzes/${encodeURIComponent(quizId)}/hidden`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden })
  });
  await refreshAll();
}

async function deleteQuiz(quizId) {
  if (!confirm("ต้องการลบควิซนี้จริงหรือไม่?")) return;
  await apiJson(`/api/admin/quizzes/${encodeURIComponent(quizId)}`, { method: "DELETE" });
  await refreshAll();
}

    function escapeHtml(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

// Init (admin page is already protected by server-side route guard)
(async function init() {
  try {
    await refreshAll();
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (msg === "not_logged_in" || msg === "forbidden") {
      window.location.href = "/index.html";
      return;
    }
    alert("โหลดข้อมูล Admin ไม่สำเร็จ (เซิร์ฟเวอร์ไม่พร้อม)");
  }
})();