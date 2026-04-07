if (!requireLogin()) {
    throw new Error("User not logged in");
}

loadUserUI();

const params = new URLSearchParams(window.location.search);
const code = params.get("code");

let quizzes = JSON.parse(localStorage.getItem("myQuizzes")) || [];
let quiz = quizzes.find(q => q.code === code);
const currentUser = getUser();

if (!quiz) {
    alert("ไม่พบข้อสอบ");
    window.location.href = "index.html";
    throw new Error("Quiz not found");
}

function goHome(){
    window.location.href = "index.html";
}

function goDashboard(){
    window.location.href = "dashboard.html";
}

function goCreate(){
    window.location.href = "create.html";
}

function goLogin(){
    window.location.href = "login.html";
}

function getCurrentUserSafe() {
    try {
        if (typeof getUser === "function") {
            return getUser();
        }
    } catch (e) {}
    return null;
}

function getDisplayName(user) {
    if (!user) return "ผู้ใช้";
    return user.name || user.username || user.email || "ผู้ใช้";
}

function getUserId(user) {
    if (!user) return "guest";
    return user.id || user.email || user.username || user.name || "guest";
}

function getInitial(name) {
    if (!name || typeof name !== "string") return "U";
    return name.trim().charAt(0).toUpperCase();
}

function avatarStorageKey(user) {
    return "quizweb_avatar_" + getUserId(user);
}

function getSavedAvatar(user) {
    return localStorage.getItem(avatarStorageKey(user)) || "";
}

function setImageOrFallback(imgEl, fallbackEl, src, fallbackText) {
    if (src) {
        imgEl.src = src;
        imgEl.style.display = "block";
        fallbackEl.style.display = "none";
    } else {
        imgEl.removeAttribute("src");
        imgEl.style.display = "none";
        fallbackEl.textContent = fallbackText;
        fallbackEl.style.display = "block";
    }
}

function renderNavbarProfile() {
    const user = getCurrentUserSafe();
    const isLoggedIn = !!user;
    const name = getDisplayName(user);
    const avatar = getSavedAvatar(user);
    const initial = getInitial(name);

    const profileMenuWrap = document.getElementById("profileMenuWrap");
    const loginBtn = document.getElementById("loginBtn");
    const navUserName = document.getElementById("navUserName");
    const navAvatarImg = document.getElementById("navAvatarImg");
    const navAvatarFallback = document.getElementById("navAvatarFallback");

    if (isLoggedIn) {
        profileMenuWrap.classList.add("show");
        loginBtn.classList.remove("show");
        navUserName.textContent = name;
    } else {
        profileMenuWrap.classList.remove("show");
        profileMenuWrap.classList.remove("open");
        loginBtn.classList.add("show");
    }

    setImageOrFallback(navAvatarImg, navAvatarFallback, avatar, initial);
}

function toggleProfileMenu() {
    const wrap = document.getElementById("profileMenuWrap");
    wrap.classList.toggle("open");
}

function closeProfileMenu() {
    document.getElementById("profileMenuWrap").classList.remove("open");
}

function handleLogout() {
    closeProfileMenu();

    if (typeof logout === "function") {
        logout();
        return;
    }

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

function normalizeQuestion(q){
    const normalized = {
        text: q?.text || "",
        type: q?.type === "multiple" ? "multiple" : "single",
        options: Array.isArray(q?.options) ? [...q.options] : ["", "", "", ""],
        correctAnswers: []
    };

    while (normalized.options.length < 4) {
        normalized.options.push("");
    }
    normalized.options = normalized.options.slice(0, 4);

    if (Array.isArray(q?.correctAnswers)) {
        normalized.correctAnswers = q.correctAnswers
            .map(v => Number(v))
            .filter(v => Number.isInteger(v) && v >= 0 && v < 4);
    } else if (q?.correct !== null && q?.correct !== undefined && q.correct !== "") {
        const one = Number(q.correct);
        if (Number.isInteger(one) && one >= 0 && one < 4) {
            normalized.correctAnswers = [one];
        }
    }

    normalized.correctAnswers = [...new Set(normalized.correctAnswers)].sort((a, b) => a - b);

    if (normalized.type === "single" && normalized.correctAnswers.length > 1) {
        normalized.correctAnswers = [normalized.correctAnswers[0]];
    }

    return normalized;
}

if (!quiz.questions || quiz.questions.length === 0) {
    alert("ข้อสอบนี้ยังไม่มีคำถาม");
    if (currentUser.username === quiz.owner) {
        window.location.href = `edit.html?code=${code}`;
    } else {
        window.location.href = "index.html";
    }
    throw new Error("Quiz has no questions");
}

quiz.questions = quiz.questions.map(normalizeQuestion);

if (quiz.allowReview == null) quiz.allowReview = true;
if (quiz.attemptsLimit == null) quiz.attemptsLimit = 0;

const isCreator = currentUser.username === quiz.owner;
const isPreview = isCreator;

if (isPreview) {
    document.getElementById("previewBanner").style.display = "flex";
    document.title = "โหมดทดลองเล่น | quizWeb";
}

let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
let playerRecord = quizResults.find(r =>
    r.quizCode === quiz.code && r.player === currentUser.username
);

if (!isCreator) {
    const attemptsLimit = Number(quiz.attemptsLimit ?? 0);
    const attemptsUsed = playerRecord ? playerRecord.attemptsUsed : 0;

    if (attemptsLimit > 0 && attemptsUsed >= attemptsLimit) {
        alert(`คุณใช้สิทธิ์ทำควิซนี้ครบ ${attemptsLimit} ครั้งแล้ว`);
        window.location.href = "index.html";
        throw new Error("Attempt limit reached");
    }
}

let current = 0;
let answers = quiz.questions.map(() => []);
let timeLeft = Number(quiz.time) || 60;
let submitted = false;
let timerId = null;

function escapeHtml(text){
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getSelectedAnswers(index){
    return Array.isArray(answers[index]) ? answers[index] : [];
}

function isQuestionAnswered(index){
    return getSelectedAnswers(index).length > 0;
}

function isSameAnswer(a, b){
    const arrA = Array.isArray(a) ? [...a].sort((x, y) => x - y) : [];
    const arrB = Array.isArray(b) ? [...b].sort((x, y) => x - y) : [];
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
        if (arrA[i] !== arrB[i]) return false;
    }
    return true;
}

function formatAnswerLetters(arr){
    if (!Array.isArray(arr) || arr.length === 0) return "-";
    return arr
        .slice()
        .sort((a, b) => a - b)
        .map(v => String.fromCharCode(65 + v))
        .join(", ");
}

function render(){
    const q = quiz.questions[current];
    const selected = getSelectedAnswers(current);

    let html = `
        <div class="badge">Question ${current + 1} of ${quiz.questions.length}</div>
        <div class="question-text">${escapeHtml(q.text)}</div>
        <div class="question-type">
            ${q.type === "multiple"
                ? "คำถามแบบหลายคำตอบ: เลือกได้มากกว่า 1 ข้อ"
                : "คำถามแบบคำตอบเดียว: เลือกได้ 1 ข้อ"}
        </div>
        <div class="options-list">
    `;

    q.options.forEach((opt, i) => {
        const active = selected.includes(i);
        html += `
            <div class="option ${active ? "active" : ""}" onclick="selectAnswer(${i})">
                <div class="letter">${String.fromCharCode(65 + i)}</div>
                <div class="option-text">${escapeHtml(opt)}</div>
                ${active ? `<div class="option-mark">เลือกแล้ว</div>` : ""}
            </div>
        `;
    });

    html += `</div>`;

    html += `
        <div class="actions">
            <button class="btn-prev" onclick="prevQuestion()">
                <span class="btn-arrow">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="2.2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                Previous
            </button>
            <button class="btn-next" onclick="nextQuestion()">
                Next
                <span class="btn-arrow">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2.2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </button>
        </div>
    `;

    document.getElementById("questionBox").innerHTML = html;
    renderNav();
    updateProgress();
}

function selectAnswer(i){
    const q = quiz.questions[current];

    if (q.type === "multiple") {
        const currentAnswers = getSelectedAnswers(current);
        const idx = currentAnswers.indexOf(i);
        if (idx === -1) {
            answers[current] = [...currentAnswers, i].sort((a, b) => a - b);
        } else {
            const cloned = [...currentAnswers];
            cloned.splice(idx, 1);
            answers[current] = cloned;
        }
    } else {
        answers[current] = [i];
    }

    render();
}

function nextQuestion(){
    if (current < quiz.questions.length - 1) {
        current++;
        render();
    } else {
        submitQuiz();
    }
}

function prevQuestion(){
    if (current > 0) {
        current--;
        render();
    }
}

function jumpQuestion(i){
    current = i;
    render();
}

function renderNav(){
    const nav = document.getElementById("nav");
    nav.innerHTML = "";

    quiz.questions.forEach((q, i) => {
        let cls = "nav-item";
        if (isQuestionAnswered(i)) cls += " answered";
        if (i === current) cls += " current";

        nav.innerHTML += `
            <div class="${cls}" onclick="jumpQuestion(${i})">${i + 1}</div>
        `;
    });
}

function updateProgress(){
    const answered = answers.filter(arr => Array.isArray(arr) && arr.length > 0).length;

    document.getElementById("progressText").innerText =
        `${answered} of ${quiz.questions.length} answered`;

    document.getElementById("progressBar").style.width =
        `${(answered / quiz.questions.length) * 100}%`;
}

function updateTimerUI(){
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const timerEl = document.getElementById("timer");
    timerEl.innerText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

    if (timeLeft <= 30) {
        timerEl.classList.add("warning");
    } else {
        timerEl.classList.remove("warning");
    }
}

function startTimer(){
    updateTimerUI();

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            submitQuiz();
        }
    }, 1000);
}

function saveScoreToServer(username, score) {
    return fetch("/api/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, score })
    }).then(function (res) {
        if (!res.ok) {
            return res.json().then(function (body) {
                throw new Error(body.error || res.statusText);
            });
        }
        return res.json();
    });
}

function saveOfficialResult(score, total){
    let quizResults = JSON.parse(localStorage.getItem("quizResults")) || [];
    let recordIndex = quizResults.findIndex(r =>
        r.quizCode === quiz.code && r.player === currentUser.username
    );

    const percent = Math.round((score / total) * 100);
    const newAttempt = {
        score: score,
        percent: percent,
        submittedAt: new Date().toLocaleString("th-TH")
    };

    if (recordIndex === -1) {
        quizResults.push({
            quizCode: quiz.code,
            quizTitle: quiz.title,
            player: currentUser.username,
            total: total,
            attemptsUsed: 1,
            bestScore: score,
            bestPercent: percent,
            attempts: [newAttempt]
        });
    } else {
        const record = quizResults[recordIndex];
        record.attempts.push(newAttempt);
        record.attemptsUsed = record.attempts.length;

        if (score > record.bestScore) {
            record.bestScore = score;
            record.bestPercent = percent;
        } else if (score === record.bestScore && percent > record.bestPercent) {
            record.bestPercent = percent;
        }

        quizResults[recordIndex] = record;
    }

    localStorage.setItem("quizResults", JSON.stringify(quizResults));
}

function buildReviewHTML(){
    if (!quiz.allowReview) return "";

    let html = `
        <div class="review-wrap">
            <div class="review-title">เฉลย</div>
    `;

    quiz.questions.forEach((q, i) => {
        const userAnswers = getSelectedAnswers(i);
        const correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
        const isCorrect = isSameAnswer(userAnswers, correctAnswers);

        html += `
            <div class="review-card">
                <div class="review-question">ข้อ ${i + 1}: ${escapeHtml(q.text)}</div>
                <div class="review-meta">
                    ${q.type === "multiple" ? "Multiple Choice" : "Single Choice"}
                </div>
        `;

        q.options.forEach((opt, j) => {
            let className = "review-option";
            if (correctAnswers.includes(j)) className += " correct";
            if (userAnswers.includes(j) && !correctAnswers.includes(j)) className += " wrong";

            let suffix = "";
            if (correctAnswers.includes(j)) suffix += " — คำตอบที่ถูก";
            if (userAnswers.includes(j) && !correctAnswers.includes(j)) suffix += " — คำตอบของคุณ";

            html += `
                <div class="${className}">
                    ${String.fromCharCode(65 + j)}. ${escapeHtml(opt)}${suffix}
                </div>
            `;
        });

        html += `
                <div class="review-note">
                    ${
                        userAnswers.length === 0
                        ? `คุณไม่ได้ตอบข้อนี้ &bull; คำตอบที่ถูกคือ ${formatAnswerLetters(correctAnswers)}`
                        : isCorrect
                            ? `คุณตอบถูก &bull; คำตอบคือ ${formatAnswerLetters(correctAnswers)}`
                            : `คุณตอบ ${formatAnswerLetters(userAnswers)} แต่คำตอบที่ถูกคือ ${formatAnswerLetters(correctAnswers)}`
                    }
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

function submitQuiz(){
    if (submitted) return;
    submitted = true;

    if (timerId) clearInterval(timerId);

    let score = 0;

    quiz.questions.forEach((q, i) => {
        const userAnswers = getSelectedAnswers(i);
        const correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
        if (isSameAnswer(userAnswers, correctAnswers)) {
            score++;
        }
    });

    if (!isCreator) {
        saveOfficialResult(score, quiz.questions.length);
    }

    const percent = Math.round((score / quiz.questions.length) * 100);

    const heading = isCreator ? "โหมดทดลองเล่นสำหรับผู้สร้าง" : "ทำควิซเสร็จแล้ว";
    const subText = isCreator
        ? "คะแนนนี้เป็นเพียงการทดลองเล่น และจะไม่ถูกนับเป็นสถิติ"
        : quiz.allowReview
            ? "ระบบบันทึกผลการเล่นเรียบร้อยแล้ว และสามารถดูเฉลยได้"
            : "ระบบบันทึกผลการเล่นเรียบร้อยแล้ว";

    const reviewHTML = buildReviewHTML();

    const serverSaveLine = !isCreator
        ? `<p id="scoreSaveStatus" class="score-sub" style="margin-top:10px;">กำลังบันทึกคะแนนไปยังเซิร์ฟเวอร์...</p>`
        : "";

    document.body.innerHTML = `
        <div class="result-wrap">
            <div class="result-card">
                <div class="result-icon">&#127881;</div>
                <h1>${heading}</h1>
                <p>${subText}</p>
                <div class="score-display">
                    <div class="score">${score} / ${quiz.questions.length}</div>
                    <div class="score-sub">คิดเป็น ${percent}%</div>
                    ${serverSaveLine}
                </div>

                ${reviewHTML}

                <div class="result-actions">
                    ${
                        isCreator
                        ? `<button class="btn-light" onclick="window.location.href='edit.html?code=${quiz.code}'">
                               กลับไปแก้ไข
                           </button>`
                        : `<button class="btn-light" onclick="window.location.href='index.html'">
                               กลับหน้าแรก
                           </button>`
                    }
                    <button class="btn-primary" onclick="window.location.href='dashboard.html'">
                        ไปคลังข้อสอบ
                    </button>
                </div>
            </div>
        </div>
    `;

    if (!isCreator) {
        saveScoreToServer(currentUser.username, score).then(
            function () {
                const el = document.getElementById("scoreSaveStatus");
                if (el) el.textContent = "Score Saved";
            },
            function () {
                const el = document.getElementById("scoreSaveStatus");
                if (el) {
                    el.textContent =
                        "ไม่สามารถบันทึกคะแนนไปยังเซิร์ฟเวอร์ได้ (ออฟไลน์หรือเซิร์ฟเวอร์ไม่พร้อม)";
                }
            }
        );
    }
}

const profilePill = document.getElementById("profilePill");
if (profilePill) {
    profilePill.addEventListener("click", function(e) {
        e.stopPropagation();
        toggleProfileMenu();
    });
}

document.addEventListener("click", function(e) {
    const wrap = document.getElementById("profileMenuWrap");
    if (wrap && !wrap.contains(e.target)) {
        closeProfileMenu();
    }
});

renderNavbarProfile();

/* ===== ตั้งค่า top card ===== */
document.getElementById("quizTitle").innerText = quiz.title || "Quiz";
document.getElementById("quizSubtitle").innerText =
    `รหัสข้อสอบ ${quiz.code} \u2022 จำนวน ${quiz.questions.length} ข้อ`;

render();
startTimer();
