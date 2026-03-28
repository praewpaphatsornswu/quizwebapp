let currentTab = "usersPanel";
    let allUsers = [];
    let allQuizzes = [];

    function getCurrentUser() {
      try {
        return JSON.parse(localStorage.getItem("loggedInUser"))
          || JSON.parse(localStorage.getItem("currentUser"))
          || JSON.parse(localStorage.getItem("user"));
      } catch (e) {
        return null;
      }
    }

    function checkAdminAccess() {
      const user = getCurrentUser();

      if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        window.location.href = "login.html";
        return false;
      }

      const role = String(user.role || "").toLowerCase();
      if (role !== "admin") {
        alert("หน้านี้สำหรับ Admin เท่านั้น");
        window.location.href = "index.html";
        return false;
      }

      return true;
    }

    function logoutAdmin() {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    }

    function safeParse(key, fallback = []) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (e) {
        return fallback;
      }
    }

    function getUsers() {
      let users =
        safeParse("users") ||
        safeParse("quizUsers") ||
        safeParse("allUsers");

      if (!Array.isArray(users) || users.length === 0) {
        users = safeParse("users");
      }

      return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
      localStorage.setItem("users", JSON.stringify(users));
    }

    function getQuizzes() {
      const possibleKeys = ["quizzes", "quizList", "allQuizzes", "myQuizzes"];
      for (const key of possibleKeys) {
        const data = safeParse(key);
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return safeParse("quizzes");
    }

    function saveQuizzes(quizzes) {
      localStorage.setItem("quizzes", JSON.stringify(quizzes));
    }

    function normalizeUser(user, index) {
      return {
        id: user.id ?? index + 1,
        username: user.username || user.name || "ไม่มีชื่อ",
        email: user.email || "-",
        role: (user.role || "user").toLowerCase(),
        status: (user.status || (user.is_active === false ? "inactive" : "active")).toLowerCase(),
        created_at: user.created_at || user.createdAt || "-"
      };
    }

    function normalizeQuiz(quiz, index) {
      const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
      return {
        id: quiz.id ?? index + 1,
        title: quiz.title || quiz.name || "ไม่มีชื่อควิซ",
        code: quiz.code || quiz.joinCode || quiz.quizCode || "-",
        creatorId: quiz.creator_id ?? quiz.creatorId ?? quiz.ownerId ?? null,
        creatorName: quiz.creatorName || quiz.ownerName || null,
        status: (quiz.status || (quiz.is_published === false ? "hidden" : "active")).toLowerCase(),
        questions,
        created_at: quiz.created_at || quiz.createdAt || "-"
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

    function updateStats() {
      document.getElementById("totalUsers").textContent = allUsers.length;
      document.getElementById("totalQuizzes").textContent = allQuizzes.length;
      document.getElementById("hiddenQuizzes").textContent =
        allQuizzes.filter(q => q.status === "hidden").length;
      document.getElementById("totalAdmins").textContent =
        allUsers.filter(u => u.role === "admin").length;
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

    function refreshAll() {
      allUsers = getUsers().map(normalizeUser);
      allQuizzes = getQuizzes().map(normalizeQuiz);
      updateStats();
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

    function changeUserRole(userId, newRole) {
      const users = getUsers().map(normalizeUser);
      const idx = users.findIndex(u => String(u.id) === String(userId));
      if (idx === -1) return;

      users[idx].role = newRole;
      saveUsers(users);
      refreshAll();
      alert("อัปเดต role เรียบร้อย");
    }

    function toggleUserStatus(userId, newStatus) {
      const users = getUsers().map(normalizeUser);
      const idx = users.findIndex(u => String(u.id) === String(userId));
      if (idx === -1) return;

      users[idx].status = newStatus;
      saveUsers(users);
      refreshAll();
      alert("อัปเดตสถานะผู้ใช้เรียบร้อย");
    }

    function deleteUser(userId) {
      if (!confirm("ต้องการลบผู้ใช้นี้จริงหรือไม่?")) return;

      let users = getUsers().map(normalizeUser);
      users = users.filter(u => String(u.id) !== String(userId));
      saveUsers(users);

      refreshAll();
      alert("ลบผู้ใช้เรียบร้อย");
    }

    function toggleQuizStatus(quizId, newStatus) {
      const quizzes = getQuizzes().map(normalizeQuiz);
      const idx = quizzes.findIndex(q => String(q.id) === String(quizId));
      if (idx === -1) return;

      quizzes[idx].status = newStatus;
      saveQuizzes(quizzes);
      refreshAll();
      alert("อัปเดตสถานะควิซเรียบร้อย");
    }

    function deleteQuiz(quizId) {
      if (!confirm("ต้องการลบควิซนี้จริงหรือไม่?")) return;

      let quizzes = getQuizzes().map(normalizeQuiz);
      quizzes = quizzes.filter(q => String(q.id) !== String(quizId));
      saveQuizzes(quizzes);

      refreshAll();
      alert("ลบควิซเรียบร้อย");
    }

    function escapeHtml(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function seedDemoData() {
      const demoUsers = [
        {
          id: 1,
          username: "admin",
          email: "admin@quizweb.com",
          role: "admin",
          status: "active",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          username: "andy",
          email: "andy@example.com",
          role: "user",
          status: "active",
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          username: "user_test",
          email: "test@example.com",
          role: "user",
          status: "inactive",
          created_at: new Date().toISOString()
        }
      ];

      const demoQuizzes = [
        {
          id: 1,
          title: "แบบทดสอบวิชา SE",
          code: "SE1234",
          creatorId: 2,
          status: "active",
          created_at: new Date().toISOString(),
          questions: [
            { id: 1, text: "SE คืออะไร?" },
            { id: 2, text: "Waterfall คืออะไร?" }
          ]
        },
        {
          id: 2,
          title: "ควิซทดลองไม่เหมาะสม",
          code: "BAD999",
          creatorId: 3,
          status: "hidden",
          created_at: new Date().toISOString(),
          questions: [
            { id: 1, text: "ตัวอย่างข้อสอบ" }
          ]
        }
      ];

      localStorage.setItem("users", JSON.stringify(demoUsers));
      localStorage.setItem("quizzes", JSON.stringify(demoQuizzes));

      const current = getCurrentUser();
      if (!current || String(current.role || "").toLowerCase() !== "admin") {
        localStorage.setItem("loggedInUser", JSON.stringify(demoUsers[0]));
      }

      refreshAll();
      alert("เพิ่มข้อมูลตัวอย่างแล้ว");
    }

    if (checkAdminAccess()) {
      refreshAll();
    }