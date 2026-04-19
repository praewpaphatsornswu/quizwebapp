## 1. Static Profiling (การวิเคราะห์โค้ดโดยไม่รันโปรแกรม)

Static Profiling คือการวิเคราะห์โครงสร้างและคุณภาพของโค้ดโดยไม่ต้องรันโปรแกรม เป็นการตรวจสอบในเชิงของ **Code Metrics**, **Complexity**, **Code Duplication** และ **Potential Issues** จากซอร์สโค้ดโดยตรง

---

### 1.1 Code Metrics (ขนาดและโครงสร้างโค้ด)

#### ตารางสรุปขนาดไฟล์ในโปรเจกต์

| ไฟล์ | ประเภท | ขนาด (Bytes) | จำนวนบรรทัด (โดยประมาณ) | หน้าที่ |
|------|--------|-------------|--------------------------|---------|
| `quiz.js` | Core Logic | 490 | 24 | ฟังก์ชันหลัก: checkAnswer, calculateScore, getQuestion |
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

#### ตารางสรุป HTML หน้าต่างๆ

| ไฟล์ HTML | ขนาด (Bytes) | หน้าที่ |
|-----------|-------------|---------|
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

Cyclomatic Complexity คือตัวชี้วัดความซับซ้อนของโค้ด โดยนับจากจำนวน decision points (if, else, for, while, &&, ||, ternary `?:`) บวกด้วย 1

**สูตร:** CC = จำนวน decision points + 1

#### ไฟล์ `quiz.js` (Core Logic)

| ฟังก์ชัน | Decision Points | Cyclomatic Complexity | ระดับความซับซ้อน |
|---------|----------------|----------------------|----------------|
| `checkAnswer(user, correct)` | 0 (ใช้ `===` เพื่อ return) | **1** | ต่ำมาก |
| `calculateScore(answers, correctAnswers)` | 2 (for loop + if) | **3** | ต่ำ |
| `getQuestion(questions, index)` | 2 (if condition: `index < 0 \|\| index >= length`) | **2** | ต่ำ |

> **สรุป quiz.js:** CC เฉลี่ย = 2.0 — โค้ดในส่วน Core Logic มีความซับซ้อนต่ำมาก อ่านง่าย บำรุงรักษาง่าย เหมาะสมกับขนาดของ function

#### ไฟล์ `js/play_func.js` (ซับซ้อนที่สุด)

| ฟังก์ชัน | Decision Points | Cyclomatic Complexity | ระดับความซับซ้อน |
|---------|----------------|----------------------|----------------|
| `normalizeQuestion(q)` | 7 | **8** | ปานกลาง |
| `selectAnswer(i)` | 3 | **4** | ต่ำ |
| `submitQuiz()` | 5 | **6** | ปานกลาง |
| `buildReviewHTML()` | 6 | **7** | ปานกลาง |
| `saveOfficialResult(score, total)` | 4 | **5** | ต่ำ |
| `isSameAnswer(a, b)` | 3 | **4** | ต่ำ |
| `render()` | 3 | **4** | ต่ำ |

> **สรุป play_func.js:** ฟังก์ชันที่ซับซ้อนที่สุดคือ `normalizeQuestion` (CC=8) เนื่องจากต้องรองรับ data format หลายรูปแบบ แต่ยังอยู่ในเกณฑ์ที่ยอมรับได้ (CC < 10)

#### ไฟล์ `js/register_func.js`

| ฟังก์ชัน | Decision Points | Cyclomatic Complexity | ระดับความซับซ้อน |
|---------|----------------|----------------------|----------------|
| `form.addEventListener (submit handler)` | 7 | **8** | ปานกลาง |
| `validatePassword (regex check)` | 2 | **3** | ต่ำ |
| `togglePassword()` | 1 | **2** | ต่ำ |

#### เกณฑ์การประเมิน Cyclomatic Complexity

| ค่า CC | ระดับความซับซ้อน | ความเสี่ยง |
|--------|----------------|-----------|
| 1 – 5 | ต่ำ (Simple) | น้อย |
| 6 – 10 | ปานกลาง (Moderate) | ปานกลาง |
| 11 – 20 | สูง (Complex) | สูง |
| > 20 | สูงมาก (Very Complex) | สูงมาก |

> **ข้อสรุป:** โค้ดทั้งโปรเจกต์มี CC อยู่ในช่วง 1–8 ซึ่งทุกฟังก์ชันอยู่ในเกณฑ์ที่ดี ไม่มีฟังก์ชันใดที่ซับซ้อนเกินไป

---

### 1.3 Code Duplication (โค้ดซ้ำกัน)

จากการตรวจสอบโค้ดในไฟล์ต่างๆ พบว่ามีส่วนของโค้ดที่ถูก **copy-paste** ซ้ำกันระหว่างไฟล์ JS หลายไฟล์ ดังนี้:

| กลุ่มโค้ดที่ซ้ำ | ปรากฏใน | จำนวนบรรทัดที่ซ้ำ |
|--------------|---------|------------------|
| Helper functions (navbar): `getCurrentUserSafe`, `getDisplayName`, `getUserId`, `getInitial`, `avatarStorageKey`, `getSavedAvatar`, `setImageOrFallback` | `login_func.js`, `register_func.js`, `dashboard_func.js`, `play_func.js`, `edit_func.js` | ~30 บรรทัด × 5 ไฟล์ = **~150 บรรทัดซ้ำ** |
| `renderNavbarProfile()` function | `login_func.js`, `register_func.js`, `dashboard_func.js`, `play_func.js`, `edit_func.js` | ~20 บรรทัด × 5 ไฟล์ = **~100 บรรทัดซ้ำ** |
| `toggleProfileMenu`, `closeProfileMenu`, `handleLogout` | ไฟล์ JS ทุกไฟล์ | ~15 บรรทัด × 5 ไฟล์ = **~75 บรรทัดซ้ำ** |
| Navigation functions (`goHome`, `goDashboard`, `goCreate`, `goLogin`) | ไฟล์ JS ทุกไฟล์ | ~4 บรรทัด × 9 ไฟล์ = **~36 บรรทัดซ้ำ** |
| `escapeHtml(text)` | `dashboard_func.js`, `play_func.js`, `edit_func.js` | ~6 บรรทัด × 3 ไฟล์ = **~18 บรรทัดซ้ำ** |

> **ข้อสังเกต:** การซ้ำของโค้ดเกิดขึ้นเพราะโปรเจกต์นี้เป็น **Vanilla JS (Multi-page App)** ที่ไม่ใช้ Framework โดยแต่ละหน้าโหลด JS ของตัวเองแยกกัน ทำให้ต้อง copy helper function ไปทุกไฟล์ หากต้องการลด duplication สามารถสร้างไฟล์ `utils.js` หรือ `navbar.js` ที่รวม helper เหล่านี้ไว้ แล้วโหลดผ่าน `<script>` tag ร่วมกันทุกหน้า

---

### 1.4 Potential Issues จากการวิเคราะห์ Static

| Issue | ตำแหน่ง | ระดับความเสี่ยง | คำอธิบาย |
|-------|---------|----------------|---------|
| **Password เก็บเป็น Plaintext** | `register_func.js` บรรทัด 189 | สูง | `const newUser = { username, email, password }` — ไม่มีการ Hash password ก่อนบันทึก localStorage |
| **ใช้ `password === password` ใน login** | `login_func.js` บรรทัด 138–139 | สูง | ระบบ login เปรียบเทียบ password ตรงๆ โดยไม่ผ่าน hashing |
| **XSS Risk จาก innerHTML** | `play_func.js` บรรทัด 519 | ปานกลาง | `document.body.innerHTML = \`...\`` ใช้ template string แต่มีการ `escapeHtml()` ป้องกันแล้วในส่วน user content |
| **Code Duplication** | JS ทุกไฟล์ | ปานกลาง | Helper functions ซ้ำกันในทุกไฟล์ ดูหัวข้อ 1.3 |
| **Global variable `submitted`** | `play_func.js` บรรทัด 205 | ต่ำ | ใช้ global variable แทน closure เพื่อป้องกัน double submit |
| **`alert()` แทน UI Dialog** | `play_func.js`, `dashboard_func.js` | ต่ำ | ใช้ `alert()` ของ browser ซึ่งไม่ consistent กับ UI Design แต่ใช้งานได้ |

---

### 1.5 Dependency Analysis

| Dependency | ประเภท | วิธีใช้งาน | หมายเหตุ |
|-----------|--------|-----------|---------|
| Jest v30.3.0 | Dev Dependency | ใช้รัน Unit Tests (quiz.test.js, ui.test.js) | ระบุใน package.json |
| Google Fonts API (Prompt) | External CDN | `<link>` tag ใน HTML | ใช้เพื่อดึงฟอนต์ภาษาไทย |
| localStorage (Web API) | Browser Built-in | เก็บข้อมูล user, quizzes, results | ไม่มี backend database |
| URLSearchParams | Browser Built-in | อ่าน query string (`?code=...`) | ใช้ใน play_func.js, dashboard_func.js |

> **สรุป:** โปรเจกต์นี้มี **external dependency น้อยมาก** เพียง Jest สำหรับ testing และ Google Fonts เท่านั้น ทำให้ไม่มี supply-chain risk และ deploy ได้ง่าย

---

### 1.6 สรุป Static Profiling

| หัวข้อ | ผลการวิเคราะห์ | ประเมิน |
|-------|--------------|---------|
| ขนาดโค้ด | ~120 KB, ~3,097 บรรทัด (JS), 9 หน้า HTML | เหมาะสมกับขนาดโปรเจกต์ |
| Cyclomatic Complexity | ค่าสูงสุด CC=8 (normalizeQuestion) | ทุกฟังก์ชันอยู่ในเกณฑ์ดี |
| Code Duplication | ~380+ บรรทัดซ้ำ ใน helper/navbar | ควรปรับปรุงในอนาคต |
| Security Issues | Password เก็บ plaintext | ต้องแก้ไขหาก deploy จริง |
| External Dependencies | น้อยมาก (Jest + Google Fonts) | ดีมาก |

---

## 2. Dynamic Profiling (การวิเคราะห์โปรแกรมขณะรัน)

Dynamic Profiling คือการวิเคราะห์พฤติกรรมของโปรแกรมขณะ **รัน (Execute)** จริง โดยวัดจาก Test Execution, Code Coverage, และ Runtime Behavior ของ Test Suite

---

### 2.1 เครื่องมือที่ใช้ใน Dynamic Profiling

| เครื่องมือ | เวอร์ชัน | บทบาท |
|-----------|---------|-------|
| **Jest** | v30.3.0 | Test Runner — รัน Unit Tests และวัด Coverage |
| **Istanbul (V8 Coverage)** | Built-in กับ Jest | Code Coverage Reporter |
| **Node.js** | (ตาม environment) | Runtime Environment สำหรับรัน Tests |

คำสั่งที่ใช้รัน Dynamic Profiling:
```bash
npx jest --verbose --coverage
```

---

### 2.2 Test Execution Results (ผลการรันเทส)

#### ผลการรัน Unit Tests ทั้งหมด

```
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        0.494 s
```

#### 2.2.1 ผลการรัน `tests/quiz.test.js` — Core Logic Tests

**Test Suite:** `Quiz Web App Test (11 Cases)`

| # | Test Case | ฟังก์ชัน | Input | Expected | Result | Status |
|---|-----------|---------|-------|----------|--------|--------|
| 1 | Correct answer returns true | `checkAnswer` | `'A', 'A'` | `true` | `true` | PASS |
| 2 | Wrong answer returns false | `checkAnswer` | `'A', 'B'` | `false` | `false` | PASS |
| 3 | Case sensitive | `checkAnswer` | `'a', 'A'` | `false` | `false` | PASS |
| 4 | Calculate full score | `calculateScore` | `['A','B','C'], ['A','B','C']` | `3` | `3` | PASS |
| 5 | Calculate zero score | `calculateScore` | `['A','A','A'], ['B','B','B']` | `0` | `0` | PASS |
| 6 | Calculate partial score | `calculateScore` | `['A','B','C'], ['A','C','C']` | `2` | `2` | PASS |
| 7 | Empty arrays | `calculateScore` | `[], []` | `0` | `0` | PASS |
| 8 | Get valid question | `getQuestion` | `['Q1','Q2','Q3'], 1` | `'Q2'` | `'Q2'` | PASS |
| 9 | Get question out of bounds (negative) | `getQuestion` | `['Q1','Q2'], -1` | `null` | `null` | PASS |
| 10 | Get question out of bounds (too large) | `getQuestion` | `['Q1','Q2'], 5` | `null` | `null` | PASS |
| 11 | Handles different array lengths | `calculateScore` | `['A','B'], ['A','B','C']` | `2` | `2` | PASS |

**ผล: 11/11 PASS**

---

#### 2.2.2 ผลการรัน `tests/ui.test.js` — UI Logic Tests

##### TC-UI-01: Login Form Validation — กรอกข้อมูลว่างเปล่า

ทดสอบฟังก์ชัน `validateLoginForm(username, password)` ซึ่ง extract มาจาก `login_func.js`

| # | Test Case | Input | Expected | Result | Status |
|---|-----------|-------|----------|--------|--------|
| UI-01-a | ทั้งสองช่องว่าง | `'', ''` | `{ ok: false, error: 'กรุณากรอก Username และ Password' }` | ตรงตาม expected | PASS |
| UI-01-b | กรอกเฉพาะ username | `'testuser', ''` | `{ ok: false, error: 'กรุณากรอก...' }` | ตรงตาม expected | PASS |
| UI-01-c | กรอกครบทั้งสองช่อง | `'testuser', 'Pass1234'` | `{ ok: true, error: '' }` | ตรงตาม expected | PASS |

**ผล: 3/3 PASS**

##### TC-UI-02: Register Form Validation — รหัสผ่านไม่ตรงกัน

ทดสอบฟังก์ชัน `validateRegisterForm({ username, password, confirmPassword })` ซึ่ง extract มาจาก `register_func.js`

| # | Test Case | Input | Expected | Result | Status |
|---|-----------|-------|----------|--------|--------|
| UI-02-a | password ไม่ตรงกัน | `password: 'Password1', confirmPassword: 'WrongPass1'` | `{ ok: false, field: 'confirmError' }` | ตรงตาม expected | PASS |
| UI-02-b | password ขาด Uppercase | `password: 'password1'` | `{ ok: false, field: 'passError' }` | ตรงตาม expected | PASS |
| UI-02-c | ข้อมูลครบถ้วน | `password: 'Password1', confirmPassword: 'Password1'` | `{ ok: true }` | ตรงตาม expected | PASS |

**ผล: 3/3 PASS**

##### TC-UI-03: Join Quiz — กรอกรหัสว่างเปล่า

ทดสอบฟังก์ชัน `validateJoinCode(code, storage)` ที่ mock localStorage

| # | Test Case | Input | Expected | Result | Status |
|---|-----------|-------|----------|--------|--------|
| UI-03-a | code เป็น empty string | `''` | `{ ok: false, error: 'กรุณากรอกรหัสข้อสอบ' }` | ตรงตาม expected | PASS |
| UI-03-b | code เป็น null | `null` | `{ ok: false, error: 'กรุณากรอกรหัสข้อสอบ' }` | ตรงตาม expected | PASS |
| UI-03-c | code เป็น whitespace | `'   '` | `{ ok: false, error: 'กรุณากรอกรหัสข้อสอบ' }` | ตรงตาม expected | PASS |

**ผล: 3/3 PASS**

##### TC-UI-04: Join Quiz — กรอกรหัสผิดหรือหมดอายุ

ทดสอบกรณี quiz code ไม่มีในระบบ, ถูกต้อง, และ quiz ไม่มีคำถาม

| # | Test Case | Input | Expected | Result | Status |
|---|-----------|-------|----------|--------|--------|
| UI-04-a | code ไม่มีในระบบ | `'XXXXXX'` | `{ ok: false, error: 'ไม่พบรหัสข้อสอบนี้' }` | ตรงตาม expected | PASS |
| UI-04-b | code ถูกต้อง | `'Q1234567890'` | `{ ok: true, quiz: {...} }` | ตรงตาม expected | PASS |
| UI-04-c | quiz ไม่มีคำถาม | `'Q_EMPTY'` | `{ ok: false, error: 'ข้อสอบนี้ยังไม่มีคำถาม' }` | ตรงตาม expected | PASS |

**ผล: 3/3 PASS**

##### TC-UI-05: Play Quiz — กดเลือกคำตอบแล้ว State ต้องอัปเดต

ทดสอบ `createQuizState(totalQuestions)` — การจัดการ state ของการตอบคำถาม

| # | Test Case | การทดสอบ | Expected | Result | Status |
|---|-----------|---------|----------|--------|--------|
| UI-05-a | เลือกตัวเลือก B (index 1) | `state.selectAnswer(1)` | `isSelected(1) === true` | ตรงตาม expected | PASS |
| UI-05-b | Single choice ต้องไม่เลือกซ้ำ | หลังเลือก B | `isSelected(0,2,3) === false` | ตรงตาม expected | PASS |
| UI-05-c | เปลี่ยนใจได้ | เลือก A → เปลี่ยนเป็น C | `isSelected(0)=false, isSelected(2)=true` | ตรงตาม expected | PASS |
| UI-05-d | progress text | ตอบข้อแรก | `progressText() === '1 of 3 answered'` | ตรงตาม expected | PASS |
| UI-05-e | progress 100% | ตอบครบทุกข้อ | `progressPercent() === 100` | ตรงตาม expected | PASS |

**ผล: 5/5 PASS**

---

### 2.3 Code Coverage Report

Code Coverage คือตัววัดว่าโค้ดส่วนใดถูก "แตะถึง" (executed) ขณะรันเทส

#### ผล Coverage จาก Jest + Istanbul

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   100   |   100    |   100   |   100   |
 quiz.js  |   100   |   100    |   100   |   100   |
----------|---------|----------|---------|---------|-------------------
```

| Metric | ค่าที่ได้ | ความหมาย |
|--------|---------|---------|
| **Statements Coverage** | **100%** | ทุก statement ใน quiz.js ถูก execute อย่างน้อย 1 ครั้ง |
| **Branch Coverage** | **100%** | ทุก branch (if/else, ternary) ถูกผ่านทั้ง true และ false path |
| **Function Coverage** | **100%** | ทุกฟังก์ชัน (`checkAnswer`, `calculateScore`, `getQuestion`) ถูกเรียก |
| **Line Coverage** | **100%** | ทุกบรรทัดของโค้ดถูกรันอย่างน้อย 1 ครั้ง |

> **ข้อสรุป:** Core Logic ใน `quiz.js` มี Coverage **100% ในทุก metric** แสดงให้เห็นว่าชุดเทสที่ออกแบบไว้ครอบคลุมทุก path ของโค้ดอย่างสมบูรณ์ ไม่มี Dead Code

#### อธิบายการวัด Branch Coverage กรณี `getQuestion`

```javascript
function getQuestion(questions, index) {
  if (index < 0 || index >= questions.length) return null;  // Branch A (true) → return null
  return questions[index];                                   // Branch B (false) → return value
}
```

- **Branch A (true):** ครอบคลุมโดย TC-09 (`index = -1`) และ TC-10 (`index = 5`)
- **Branch B (false):** ครอบคลุมโดย TC-08 (`index = 1` ซึ่งอยู่ในช่วงที่ถูกต้อง)
- **ผล:** 100% Branch Coverage

---

### 2.4 Runtime Performance (เวลาที่ใช้ในการรัน)

| Metric | ค่าที่วัดได้ |
|--------|-----------|
| เวลารันเทสทั้งหมด | **0.494 วินาที** |
| จำนวน Test Suite | 2 suites |
| จำนวน Test Cases | 28 cases |
| เวลาเฉลี่ยต่อ test | ~0.018 วินาที/test |

> **สรุป:** ชุดเทสทั้งหมดรันเสร็จใน **<0.5 วินาที** ซึ่งเร็วมาก เนื่องจากเทสทุกตัวเป็น Pure Unit Test ที่ไม่ต้องรอ I/O หรือ Network และไม่ต้องโหลด browser

---

### 2.5 เปรียบเทียบ Static vs Dynamic Profiling

| หัวข้อ | Static Profiling | Dynamic Profiling |
|-------|----------------|------------------|
| **เวลาที่ทำ** | วิเคราะห์จากซอร์สโค้ดโดยตรง (ไม่รันโปรแกรม) | รันโปรแกรม (Jest) แล้วเก็บผลลัพธ์ |
| **สิ่งที่วัด** | โครงสร้าง, ความซับซ้อน, ความซ้ำของโค้ด | จำนวนเทสที่ผ่าน, Coverage, เวลารัน |
| **เครื่องมือ** | การอ่านโค้ดด้วยตนเอง (Manual Review) | Jest + Istanbul |
| **ผลลัพธ์** | พบ Code Duplication, Security Issue (password plaintext) | 28/28 PASS, Coverage 100% |
| **ข้อจำกัด** | ไม่รู้พฤติกรรม runtime | ครอบคลุมเฉพาะ quiz.js (core logic) |

---

### 2.6 สรุป Dynamic Profiling

| หัวข้อ | ผล | ประเมิน |
|-------|-----|---------|
| Test Cases ทั้งหมด | 28/28 PASS | สมบูรณ์ |
| Core Logic Coverage (quiz.js) | 100% ทุก metric | ดีเยี่ยม |
| UI Logic Tests | 17/17 PASS (5 Test Suites) | ครอบคลุมทุก scenario |
| เวลารัน | 0.494 วินาที | รวดเร็ว |
| Test ล้มเหลว | 0 | ไม่มี |

---

## 3. สิ่งที่ค้นพบและข้อเสนอแนะ

### 3.1 จุดแข็ง (Strengths)
- Core Logic (`quiz.js`) มีความซับซ้อนต่ำ (CC เฉลี่ย 2.0) อ่านและบำรุงรักษาง่าย
- มี Test Coverage 100% ใน Core Logic ไม่มี Dead Code
- Test ทั้ง 28 ตัวผ่านทั้งหมด แสดงว่า logic ทำงานถูกต้อง
- External Dependencies น้อยมาก ลด risk จาก third-party
- มีการป้องกัน XSS ด้วย `escapeHtml()` ก่อน inject HTML

### 3.2 จุดที่ควรปรับปรุง (Areas for Improvement)
- **Security:** ควร Hash password (เช่นใช้ bcrypt) ก่อนเก็บใน localStorage
- **Code Duplication:** ควรรวม Navbar/Helper functions ไปไว้ในไฟล์ `shared.js` เพื่อลดการซ้ำซ้อน
- **Coverage ของ UI Files:** ไฟล์ JS หน้าอื่น (`play_func.js`, `dashboard_func.js` ฯลฯ) ยังไม่ได้ครอบคลุมใน Coverage Report เนื่องจากต้องโหลดร่วมกับ browser
- **`alert()` dialog:** ควรเปลี่ยนเป็น custom modal dialog เพื่อ UX ที่ดีขึ้นและ consistent กับ design

---

## 4. สรุปภาพรวม 

Phase 4 ได้ทำการวิเคราะห์โปรเจกต์ **quizWeb** ใน 2 มิติหลักคือ:

1. **Static Profiling** — วิเคราะห์โครงสร้างโค้ดโดยไม่รัน พบว่าโค้ดมีความซับซ้อนต่ำ (CC สูงสุด 8) มี Code Duplication สูงในส่วน Navbar Helper และมีความเสี่ยงด้าน Security จากการเก็บ Password แบบ Plaintext

2. **Dynamic Profiling** — รันชุดเทสทั้งหมด 28 test ผ่าน Jest ผลลัพธ์คือ **ผ่านทั้งหมด 100%** และ Code Coverage ของ Core Logic (`quiz.js`) อยู่ที่ **100% ในทุก metric** ซึ่งแสดงให้เห็นว่าชุดเทสครอบคลุมทุก execution path ของโค้ดหลัก

การทำ Profiling ทั้ง 2 ประเภทนี้ช่วยให้ทีมพัฒนาเข้าใจสถานะของโค้ดได้ครบทุกมิติ ทั้งด้านคุณภาพโครงสร้าง (Static) และความถูกต้องในการทำงานจริง (Dynamic) ซึ่งเป็นพื้นฐานสำคัญของการพัฒนาซอฟต์แวร์คุณภาพสูง

