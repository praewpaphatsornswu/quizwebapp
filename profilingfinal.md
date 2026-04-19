# Profiling Report — QuizWeb Application

> **โปรเจกต์:** quizwebapp · **Repository:** [praewpaphatsornswu/quizwebapp](https://github.com/praewpaphatsornswu/quizwebapp)
> **วันที่วิเคราะห์:** 19 เมษายน 2569 · **เครื่องมือ:** Manual Code Review, Jest v30.3.0, Istanbul (V8 Coverage)

---

## 1. Static Profiling (การวิเคราะห์โค้ดโดยไม่รันโปรแกรม)

Static Profiling คือการวิเคราะห์โครงสร้างและคุณภาพของโค้ดโดยไม่ต้องรันโปรแกรม เป็นการตรวจสอบในเชิงของ **Code Metrics**, **Cyclomatic Complexity**, **Code Duplication** และ **Potential Issues** จากซอร์สโค้ดโดยตรง

---

### 1.1 Code Metrics (ขนาดและโครงสร้างโค้ด)

#### ตารางสรุปไฟล์ JavaScript

| ไฟล์ | ประเภท | ขนาด (Bytes) | จำนวนบรรทัด | หน้าที่หลัก |
|------|--------|:-----------:|:-----------:|------------|
| `quiz.js` | Core Logic | 490 | 24 | `checkAnswer`, `calculateScore`, `getQuestion` |
| `js/login_func.js` | UI Logic | 7,513 | 183 | จัดการ Login / Navbar |
| `js/register_func.js` | UI Logic | 9,980 | 228 | จัดการ Register / Navbar |
| `js/dashboard_func.js` | UI Logic | 22,324 | 514 | แสดงรายการควิซ / สถิติ |
| `js/play_func.js` | UI Logic | 18,791 | 576 | ระบบเล่นข้อสอบ / Timer / Submit |
| `js/create.js` | UI Logic | 13,764 | ~350 | สร้างข้อสอบใหม่ |
| `js/edit_func.js` | UI Logic | 18,879 | ~480 | แก้ไขข้อสอบ |
| `js/index_func.js` | UI Logic | 11,171 | ~280 | หน้าแรก |
| `js/admin_func.js` | Admin Logic | 14,666 | ~380 | ระบบ Admin |
| `js/auth.js` | Auth Helper | 2,143 | ~55 | Helper สำหรับ Authentication |
| `js/join_func.js` | UI Logic | 841 | ~25 | เข้าร่วมควิซด้วยรหัส |
| **รวมทั้งหมด** | | **~120,562** | **~3,097** | |

#### ตารางสรุปไฟล์ HTML

| ไฟล์ HTML | ขนาด (Bytes) | หน้าที่ |
|-----------|:-----------:|--------|
| `index.html` | 17,570 | หน้าแรก |
| `login.html` | 6,394 | หน้า Login |
| `register.html` | 9,557 | หน้า Register |
| `dashboard.html` | 8,482 | คลังข้อสอบ |
| `create.html` | 14,621 | สร้างข้อสอบ |
| `edit.html` | 16,383 | แก้ไขข้อสอบ |
| `play.html` | 9,910 | เล่นข้อสอบ |
| `join.html` | 1,391 | เข้าร่วมด้วยรหัส |
| `admin.html` | 6,187 | หน้า Admin |

---

### 1.2 Cyclomatic Complexity (ความซับซ้อนของ Logic)

Cyclomatic Complexity (CC) คือตัวชี้วัดความซับซ้อนของโค้ด โดยนับจากจำนวน **decision points** (if, else, for, while, &&, ||, ternary `?:`) บวกด้วย 1

> **สูตร:** CC = จำนวน Decision Points + 1

#### ไฟล์ `quiz.js` — Core Logic

| ฟังก์ชัน | Decision Points | Cyclomatic Complexity | ระดับความซับซ้อน |
|---------:|:--------------:|:--------------------:|:--------------:|
| `checkAnswer(user, correct)` | 0 | **1** | ต่ำมาก |
| `calculateScore(answers, correctAnswers)` | 2 (for + if) | **3** | ต่ำ |
| `getQuestion(questions, index)` | 2 (`index < 0 \|\| index >= length`) | **2** | ต่ำ |
| **ค่าเฉลี่ย** | | **2.0** | **ต่ำ** |

> **สรุป quiz.js:** CC เฉลี่ย = **2.0** — Core Logic มีความซับซ้อนต่ำมาก อ่านง่าย บำรุงรักษาง่าย เหมาะสมกับขนาดของ function

#### ไฟล์ `js/play_func.js` — ฟังก์ชันที่ซับซ้อนที่สุด

| ฟังก์ชัน | Decision Points | Cyclomatic Complexity | ระดับความซับซ้อน |
|---------:|:--------------:|:--------------------:|:--------------:|
| `normalizeQuestion(q)` | 7 | **8** | ปานกลาง |
| `buildReviewHTML()` | 6 | **7** | ปานกลาง |
| `submitQuiz()` | 5 | **6** | ปานกลาง |
| `saveOfficialResult(score, total)` | 4 | **5** | ต่ำ |
| `isSameAnswer(a, b)` | 3 | **4** | ต่ำ |
| `selectAnswer(i)` | 3 | **4** | ต่ำ |
| `render()` | 3 | **4** | ต่ำ |

> **สรุป play_func.js:** ฟังก์ชันที่ซับซ้อนที่สุดคือ `normalizeQuestion` (CC=8) เนื่องจากต้องรองรับ data format หลายรูปแบบ แต่ยังอยู่ในเกณฑ์ที่ยอมรับได้ (CC < 10)

#### ไฟล์ `js/register_func.js`

| ฟังก์ชัน | Decision Points | Cyclomatic Complexity | ระดับความซับซ้อน |
|---------:|:--------------:|:--------------------:|:--------------:|
| `form.addEventListener (submit handler)` | 7 | **8** | ปานกลาง |
| `validatePassword (regex check)` | 2 | **3** | ต่ำ |
| `togglePassword()` | 1 | **2** | ต่ำ |

#### เกณฑ์การประเมิน Cyclomatic Complexity

| ค่า CC | ระดับความซับซ้อน | ความเสี่ยง | ผลลัพธ์ของโปรเจกต์นี้ |
|:------:|:---------------:|:---------:|:-------------------:|
| 1 – 5 | ต่ำ (Simple) | น้อย | ส่วนใหญ่อยู่ในช่วงนี้ ✓ |
| 6 – 10 | ปานกลาง (Moderate) | ปานกลาง | บางฟังก์ชัน (CC สูงสุด 8) ✓ |
| 11 – 20 | สูง (Complex) | สูง | ไม่มี ✓ |
| > 20 | สูงมาก (Very Complex) | สูงมาก | ไม่มี ✓ |

> **ข้อสรุป:** โค้ดทั้งโปรเจกต์มี CC อยู่ในช่วง **1–8** ซึ่งทุกฟังก์ชันอยู่ในเกณฑ์ที่ดี ไม่มีฟังก์ชันใดที่ซับซ้อนเกินไป

---

### 1.3 Code Duplication (โค้ดซ้ำกัน)

จากการตรวจสอบโค้ดในไฟล์ต่างๆ พบว่ามีส่วนของโค้ดที่ถูก copy-paste ซ้ำกันระหว่างไฟล์ JS หลายไฟล์ ดังนี้:

| กลุ่มโค้ดที่ซ้ำ | ปรากฏใน | บรรทัดที่ซ้ำ (ประมาณ) |
|----------------|---------|:---------------------:|
| Helper functions (navbar): `getCurrentUserSafe`, `getDisplayName`, `getUserId`, `getInitial`, `avatarStorageKey`, `getSavedAvatar`, `setImageOrFallback` | `login_func.js`, `register_func.js`, `dashboard_func.js`, `play_func.js`, `edit_func.js` | ~30 × 5 = **~150 บรรทัด** |
| `renderNavbarProfile()` | `login_func.js`, `register_func.js`, `dashboard_func.js`, `play_func.js`, `edit_func.js` | ~20 × 5 = **~100 บรรทัด** |
| `toggleProfileMenu`, `closeProfileMenu`, `handleLogout` | ไฟล์ JS ทุกไฟล์ | ~15 × 5 = **~75 บรรทัด** |
| Navigation functions (`goHome`, `goDashboard`, `goCreate`, `goLogin`) | ไฟล์ JS ทุกไฟล์ | ~4 × 9 = **~36 บรรทัด** |
| `escapeHtml(text)` | `dashboard_func.js`, `play_func.js`, `edit_func.js` | ~6 × 3 = **~18 บรรทัด** |
| **รวม** | | **~379 บรรทัดซ้ำ** |

> **ข้อสังเกต:** การซ้ำของโค้ดเกิดขึ้นเพราะโปรเจกต์นี้เป็น **Vanilla JS Multi-page App** ที่ไม่ใช้ Framework โดยแต่ละหน้าโหลด JS ของตัวเองแยกกัน ทำให้ต้อง copy helper function ไปทุกไฟล์ หากต้องการลด duplication สามารถสร้างไฟล์ `shared.js` หรือ `navbar.js` รวม helper เหล่านี้ แล้วโหลดผ่าน `<script>` tag ร่วมกันทุกหน้า

---

### 1.4 Potential Issues จากการวิเคราะห์ Static

| Issue | ตำแหน่ง | ระดับความเสี่ยง | คำอธิบาย |
|-------|---------|:--------------:|---------|
| **Password เก็บเป็น Plaintext** | `register_func.js` บรรทัด 189 | 🔴 สูง | `const newUser = { username, email, password }` — ไม่มีการ Hash password ก่อนบันทึก localStorage |
| **Login เปรียบเทียบ Password ตรงๆ** | `login_func.js` บรรทัด 138–139 | 🔴 สูง | ระบบ login เปรียบเทียบ password โดยไม่ผ่าน hashing |
| **XSS Risk จาก innerHTML** | `play_func.js` บรรทัด 519 | 🟡 ปานกลาง | `document.body.innerHTML = \`...\`` — ใช้ template string แต่มี `escapeHtml()` ป้องกัน user content แล้ว |
| **Code Duplication** | JS ทุกไฟล์ | 🟡 ปานกลาง | Helper functions ซ้ำกันในทุกไฟล์ (ดูหัวข้อ 1.3) |
| **Global variable `submitted`** | `play_func.js` บรรทัด 205 | 🟢 ต่ำ | ใช้ global variable แทน closure เพื่อป้องกัน double submit |
| **`alert()` แทน UI Dialog** | `play_func.js`, `dashboard_func.js` | 🟢 ต่ำ | ใช้ `alert()` ของ browser ซึ่งไม่ consistent กับ UI Design |

---

### 1.5 Dependency Analysis

| Dependency | ประเภท | วิธีใช้งาน | หมายเหตุ |
|-----------|:------:|-----------|---------|
| Jest v30.3.0 | Dev Dependency | รัน Unit Tests (`quiz.test.js`, `ui.test.js`) | ระบุใน `package.json` |
| Google Fonts API (Prompt) | External CDN | `<link>` tag ใน HTML | ใช้เพื่อดึงฟอนต์ภาษาไทย |
| localStorage (Web API) | Browser Built-in | เก็บข้อมูล user, quizzes, results | ไม่มี backend database |
| URLSearchParams | Browser Built-in | อ่าน query string (`?code=...`) | ใช้ใน `play_func.js`, `dashboard_func.js` |

> **สรุป:** โปรเจกต์นี้มี **external dependency น้อยมาก** เพียง Jest สำหรับ testing และ Google Fonts เท่านั้น ทำให้ไม่มี supply-chain risk และ deploy ได้ง่าย

---

### 1.6 สรุป Static Profiling

| หัวข้อ | ผลการวิเคราะห์ | ประเมิน |
|-------|:-------------:|:-------:|
| ขนาดโค้ด | ~120 KB, ~3,097 บรรทัด (JS), 9 หน้า HTML | เหมาะสมกับขนาดโปรเจกต์ ✓ |
| Cyclomatic Complexity | ค่าสูงสุด CC=8 (`normalizeQuestion`) | ทุกฟังก์ชันอยู่ในเกณฑ์ดี ✓ |
| Code Duplication | ~379 บรรทัดซ้ำ ใน helper/navbar | ควรปรับปรุงในอนาคต ⚠️ |
| Security Issues | Password เก็บ plaintext | ต้องแก้ไขหาก deploy จริง ⚠️ |
| External Dependencies | น้อยมาก (Jest + Google Fonts) | ดีมาก ✓ |

---

## 2. Dynamic Profiling (การวิเคราะห์โปรแกรมขณะรัน)

Dynamic Profiling คือการวิเคราะห์พฤติกรรมของโปรแกรมขณะ **รัน (Execute)** จริง โดยวัดจาก Test Execution, Code Coverage และ Runtime Behavior ของ Test Suite

---

### 2.1 เครื่องมือที่ใช้ใน Dynamic Profiling

| เครื่องมือ | เวอร์ชัน | บทบาท |
|-----------|:-------:|-------|
| **Jest** | v30.3.0 | Test Runner — รัน Unit Tests และวัด Coverage |
| **Istanbul (V8 Coverage)** | Built-in กับ Jest | Code Coverage Reporter |
| **Node.js** | (ตาม environment) | Runtime Environment สำหรับรัน Tests |

คำสั่งที่ใช้รัน Dynamic Profiling:

```bash
npx jest --verbose --coverage
```

---

### 2.2 Test Execution Results (ผลการรันเทส)

#### สรุปผลการรันทั้งหมด

```
PASS tests/ui.test.js
PASS tests/quiz.test.js

Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        0.742 s
```

---

#### 2.2.1 ผลการรัน `tests/quiz.test.js` — Core Logic Tests

**Test Suite:** `Quiz Web App Test (11 Cases)`

| # | Test Case | ฟังก์ชัน | Input | Expected | Result | Status |
|:-:|-----------|:-------:|-------|:--------:|:------:|:------:|
| 1 | Correct answer returns true | `checkAnswer` | `'A', 'A'` | `true` | `true` | ✅ PASS |
| 2 | Wrong answer returns false | `checkAnswer` | `'A', 'B'` | `false` | `false` | ✅ PASS |
| 3 | Case sensitive | `checkAnswer` | `'a', 'A'` | `false` | `false` | ✅ PASS |
| 4 | Calculate full score | `calculateScore` | `['A','B','C'], ['A','B','C']` | `3` | `3` | ✅ PASS |
| 5 | Calculate zero score | `calculateScore` | `['A','A','A'], ['B','B','B']` | `0` | `0` | ✅ PASS |
| 6 | Calculate partial score | `calculateScore` | `['A','B','C'], ['A','C','C']` | `2` | `2` | ✅ PASS |
| 7 | Empty arrays | `calculateScore` | `[], []` | `0` | `0` | ✅ PASS |
| 8 | Get valid question | `getQuestion` | `['Q1','Q2','Q3'], 1` | `'Q2'` | `'Q2'` | ✅ PASS |
| 9 | Get question out of bounds (negative) | `getQuestion` | `['Q1','Q2'], -1` | `null` | `null` | ✅ PASS |
| 10 | Get question out of bounds (too large) | `getQuestion` | `['Q1','Q2'], 5` | `null` | `null` | ✅ PASS |
| 11 | Handles different array lengths | `calculateScore` | `['A','B'], ['A','B','C']` | `2` | `2` | ✅ PASS |

**ผล: 11/11 PASS ✅**

---

#### 2.2.2 ผลการรัน `tests/ui.test.js` — UI Logic Tests

##### TC-UI-01: Login Form Validation — กรอกข้อมูลว่างเปล่า

ทดสอบฟังก์ชัน `validateLoginForm(username, password)` — extract มาจาก `login_func.js`

| # | Test Case | Input | Expected | Status |
|:-:|-----------|-------|:--------:|:------:|
| UI-01-a | ทั้งสองช่องว่าง | `('', '')` | `{ ok: false, error: 'กรุณากรอก Username และ Password' }` | ✅ PASS |
| UI-01-b | กรอกเฉพาะ username | `('testuser', '')` | `{ ok: false, error: 'กรุณากรอก...' }` | ✅ PASS |
| UI-01-c | กรอกครบทั้งสองช่อง | `('testuser', 'Pass1234')` | `{ ok: true, error: '' }` | ✅ PASS |

**ผล: 3/3 PASS ✅**

---

##### TC-UI-02: Register Form Validation — รหัสผ่านไม่ตรงกัน

ทดสอบฟังก์ชัน `validateRegisterForm({ username, password, confirmPassword })` — extract มาจาก `register_func.js`

| # | Test Case | Input (password) | Expected | Status |
|:-:|-----------|:----------------:|:--------:|:------:|
| UI-02-a | password ไม่ตรงกัน | `'Password1'` vs `'WrongPass1'` | `{ ok: false, field: 'confirmError' }` | ✅ PASS |
| UI-02-b | password ขาด Uppercase | `'password1'` | `{ ok: false, field: 'passError' }` | ✅ PASS |
| UI-02-c | ข้อมูลครบถ้วน | `'Password1'` vs `'Password1'` | `{ ok: true }` | ✅ PASS |

**ผล: 3/3 PASS ✅**

---

##### TC-UI-03: Join Quiz — กรอกรหัสว่างเปล่า

ทดสอบฟังก์ชัน `validateJoinCode(code, storage)` ที่ mock localStorage

| # | Test Case | Input (code) | Expected | Status |
|:-:|-----------|:------------:|:--------:|:------:|
| UI-03-a | Empty string | `''` | `{ ok: false, error: 'กรุณากรอกรหัสข้อสอบ' }` | ✅ PASS |
| UI-03-b | Null | `null` | `{ ok: false, error: 'กรุณากรอกรหัสข้อสอบ' }` | ✅ PASS |
| UI-03-c | Whitespace only | `'   '` | `{ ok: false, error: 'กรุณากรอกรหัสข้อสอบ' }` | ✅ PASS |

**ผล: 3/3 PASS ✅**

---

##### TC-UI-04: Join Quiz — กรอกรหัสผิดหรือหมดอายุ

ทดสอบกรณี quiz code ไม่มีในระบบ, ถูกต้อง, และ quiz ไม่มีคำถาม (storage มี quiz `Q1234567890` และ `Q_EMPTY`)

| # | Test Case | Input (code) | Expected | Status |
|:-:|-----------|:------------:|:--------:|:------:|
| UI-04-a | Code ไม่มีในระบบ | `'XXXXXX'` | `{ ok: false, error: 'ไม่พบรหัสข้อสอบนี้' }` | ✅ PASS |
| UI-04-b | Code ถูกต้อง | `'Q1234567890'` | `{ ok: true, quiz: { title: 'ทดสอบวิชาคณิตศาสตร์', ... } }` | ✅ PASS |
| UI-04-c | Quiz ไม่มีคำถาม | `'Q_EMPTY'` | `{ ok: false, error: 'ข้อสอบนี้ยังไม่มีคำถาม' }` | ✅ PASS |

**ผล: 3/3 PASS ✅**

---

##### TC-UI-05: Play Quiz — กดเลือกคำตอบแล้ว State ต้องอัปเดต

ทดสอบ `createQuizState(totalQuestions)` — การจัดการ state ของการตอบคำถาม (จำลอง quiz 3 ข้อ)

| # | Test Case | การทดสอบ | Expected | Status |
|:-:|-----------|---------|:--------:|:------:|
| UI-05-a | เลือกตัวเลือก B (index 1) | `state.selectAnswer(1)` | `isSelected(1) === true` | ✅ PASS |
| UI-05-b | Single choice — ตัวอื่นต้องไม่ถูกเลือก | หลังเลือก B | `isSelected(0,2,3) === false` | ✅ PASS |
| UI-05-c | เปลี่ยนใจได้ | เลือก A → เปลี่ยนเป็น C | `isSelected(0)=false, isSelected(2)=true` | ✅ PASS |
| UI-05-d | Progress text | ตอบข้อแรก | `progressText() === '1 of 3 answered'` | ✅ PASS |
| UI-05-e | Progress 100% | ตอบครบทุกข้อ | `progressPercent() === 100` | ✅ PASS |

**ผล: 5/5 PASS ✅**

---

### 2.3 สรุปผลการรันเทส UI ทั้งหมด

| Test Suite | จำนวน Test | ผ่าน | ไม่ผ่าน |
|-----------|:---------:|:---:|:------:|
| TC-UI-01: Login Form Validation | 3 | 3 | 0 |
| TC-UI-02: Register Form Validation | 3 | 3 | 0 |
| TC-UI-03: Join Quiz — รหัสว่าง | 3 | 3 | 0 |
| TC-UI-04: Join Quiz — รหัสผิด | 3 | 3 | 0 |
| TC-UI-05: Play Quiz — เลือกคำตอบ | 5 | 5 | 0 |
| **รวม UI Tests** | **17** | **17** | **0** |

---

### 2.4 Code Coverage Report

Code Coverage คือตัววัดว่าโค้ดส่วนใดถูก "แตะถึง" (executed) ขณะรันเทส

#### ผล Coverage จาก Jest + Istanbul (V8)

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 quiz.js  |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------
```

| Metric | ค่าที่ได้ | ความหมาย |
|--------|:-------:|---------|
| **Statements Coverage** | **100%** | ทุก statement ใน `quiz.js` ถูก execute อย่างน้อย 1 ครั้ง |
| **Branch Coverage** | **100%** | ทุก branch (if/else, ternary) ถูกผ่านทั้ง true และ false path |
| **Function Coverage** | **100%** | ทุกฟังก์ชัน (`checkAnswer`, `calculateScore`, `getQuestion`) ถูกเรียก |
| **Line Coverage** | **100%** | ทุกบรรทัดของโค้ดถูกรันอย่างน้อย 1 ครั้ง |

> **ข้อสรุป:** Core Logic ใน `quiz.js` มี Coverage **100% ในทุก metric** แสดงให้เห็นว่าชุดเทสที่ออกแบบไว้ครอบคลุมทุก path ของโค้ดอย่างสมบูรณ์ ไม่มี Dead Code

---

#### อธิบายการวัด Branch Coverage กรณี `getQuestion`

```javascript
function getQuestion(questions, index) {
  if (index < 0 || index >= questions.length) return null;  // Branch A (true) → return null
  return questions[index];                                   // Branch B (false) → return value
}
```

| Branch | Condition | ครอบคลุมโดย | ผล |
|:------:|-----------|------------|:--:|
| A (true) | `index < 0` | TC-09: `getQuestion(['Q1','Q2'], -1)` | ✅ |
| A (true) | `index >= length` | TC-10: `getQuestion(['Q1','Q2'], 5)` | ✅ |
| B (false) | ทั้งคู่ false | TC-08: `getQuestion(['Q1','Q2','Q3'], 1)` | ✅ |

**ผล Branch Coverage: 100%** ✅

---

#### อธิบายการวัด Branch Coverage กรณี `calculateScore`

```javascript
function calculateScore(answers, correctAnswers) {
  let score = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === correctAnswers[i]) {  // Branch A (true) / Branch B (false)
      score++;
    }
  }
  return score;
}
```

| Branch | Condition | ครอบคลุมโดย | ผล |
|:------:|-----------|------------|:--:|
| A (true) | คำตอบตรงกัน | TC-04: `calculateScore(['A','B','C'], ['A','B','C'])` | ✅ |
| B (false) | คำตอบไม่ตรง | TC-05: `calculateScore(['A','A','A'], ['B','B','B'])` | ✅ |
| Loop ไม่ทำงาน | array ว่าง | TC-07: `calculateScore([], [])` | ✅ |

**ผล Branch Coverage: 100%** ✅

---

### 2.5 Runtime Performance (เวลาที่ใช้ในการรัน)

| Metric | ค่าที่วัดได้ |
|--------|:----------:|
| เวลารันเทสทั้งหมด | **0.742 วินาที** |
| จำนวน Test Suite | 2 suites |
| จำนวน Test Cases ทั้งหมด | 28 cases |
| เวลาเฉลี่ยต่อ test | ~0.026 วินาที/test |
| Test ล้มเหลว | 0 |

> **สรุป:** ชุดเทสทั้งหมดรันเสร็จใน **< 1 วินาที** ซึ่งเร็วมาก เนื่องจากเทสทุกตัวเป็น Pure Unit Test ที่ไม่ต้องรอ I/O, Network และไม่ต้องโหลด browser

---

### 2.6 สรุป Dynamic Profiling

| หัวข้อ | ผล | ประเมิน |
|-------|:--:|:-------:|
| Test Suites | 2/2 PASS | สมบูรณ์ ✓ |
| Test Cases ทั้งหมด | 28/28 PASS | สมบูรณ์ ✓ |
| Core Logic Coverage (`quiz.js`) | 100% ทุก metric | ดีเยี่ยม ✓ |
| UI Logic Tests | 17/17 PASS (5 Test Suites) | ครอบคลุมทุก scenario ✓ |
| เวลารัน | 0.742 วินาที | รวดเร็ว ✓ |
| Test ล้มเหลว | 0 | ไม่มี ✓ |

---

## 3. เปรียบเทียบ Static vs Dynamic Profiling

| หัวข้อ | Static Profiling | Dynamic Profiling |
|-------|:---------------:|:----------------:|
| **เวลาที่ทำ** | วิเคราะห์จากซอร์สโค้ดโดยตรง (ไม่รันโปรแกรม) | รันโปรแกรม (Jest) แล้วเก็บผลลัพธ์ |
| **สิ่งที่วัด** | โครงสร้าง, ความซับซ้อน, ความซ้ำของโค้ด | จำนวนเทสที่ผ่าน, Coverage, เวลารัน |
| **เครื่องมือ** | Manual Code Review | Jest + Istanbul |
| **ผลลัพธ์** | พบ Code Duplication, Security Issue (password plaintext) | 28/28 PASS, Coverage 100% |
| **ข้อจำกัด** | ไม่รู้พฤติกรรม runtime | ครอบคลุมเฉพาะ `quiz.js` (core logic) |

---

## 4. สิ่งที่ค้นพบและข้อเสนอแนะ

### 4.1 จุดแข็ง (Strengths)

- **Core Logic มีความซับซ้อนต่ำ** — `quiz.js` มี CC เฉลี่ย 2.0 อ่านและบำรุงรักษาง่าย
- **Test Coverage 100%** — Core Logic (`quiz.js`) ไม่มี Dead Code ทุก path ถูกทดสอบแล้ว
- **Test ผ่านทั้งหมด** — 28/28 ทั้ง Core Logic และ UI Logic แสดงว่า logic ทำงานถูกต้อง
- **External Dependencies น้อยมาก** — ลด risk จาก third-party supply chain
- **มีการป้องกัน XSS** — ใช้ `escapeHtml()` ก่อน inject HTML ใน user content

### 4.2 จุดที่ควรปรับปรุง (Areas for Improvement)

- **Security:** ควร Hash password (เช่น bcrypt) ก่อนเก็บใน localStorage หรือย้ายไปใช้ Backend
- **Code Duplication:** ควรรวม Navbar/Helper functions ไปไว้ในไฟล์ `shared.js` เพื่อลดการซ้ำซ้อน ~379 บรรทัด
- **Coverage ของ UI Files:** ไฟล์ JS หน้าอื่น (`play_func.js`, `dashboard_func.js` ฯลฯ) ยังไม่อยู่ใน Coverage Report เนื่องจากต้องโหลดร่วมกับ browser
- **`alert()` dialog:** ควรเปลี่ยนเป็น custom modal dialog เพื่อ UX ที่ดีขึ้นและ consistent กับ design

---

## 5. สรุปภาพรวม

การทำ Profiling ของโปรเจกต์ **quizWeb** ครอบคลุม 2 มิติหลักคือ:

1. **Static Profiling** — วิเคราะห์โครงสร้างโค้ดโดยไม่รัน พบว่าโค้ดมีความซับซ้อนต่ำ (CC สูงสุด **8**) มี Code Duplication สูงในส่วน Navbar Helper (~379 บรรทัด) และมีความเสี่ยงด้าน Security จากการเก็บ Password แบบ Plaintext ซึ่งควรปรับปรุงหาก deploy จริง

2. **Dynamic Profiling** — รันชุดเทสทั้งหมด **28 test** ผ่าน Jest ผลลัพธ์คือ **ผ่านทั้งหมด 100%** และ Code Coverage ของ Core Logic (`quiz.js`) อยู่ที่ **100% ในทุก metric** (Statements, Branch, Function, Line) แสดงให้เห็นว่าชุดเทสครอบคลุมทุก execution path ของโค้ดหลักอย่างสมบูรณ์

การทำ Profiling ทั้ง 2 ประเภทนี้ช่วยให้ทีมพัฒนาเข้าใจสถานะของโค้ดได้ครบทุกมิติ ทั้งด้านคุณภาพโครงสร้าง (Static) และความถูกต้องในการทำงานจริง (Dynamic) ซึ่งเป็นพื้นฐานสำคัญของการพัฒนาซอฟต์แวร์คุณภาพสูง
