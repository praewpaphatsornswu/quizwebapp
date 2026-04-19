/**
 * ui.test.js — 5 UI Test Cases สำหรับ quizWeb Application
 *
 * ทดสอบ UI logic ของแต่ละหน้าโดยแยก function ออกมาจาก HTML
 * ทุก test case มีการตรวจสอบ Expected Results อย่างชัดเจน
 *
 * หน้าที่ครอบคลุม:
 *   TC-UI-01 → login_func.js    : validate login form (empty input)
 *   TC-UI-02 → register_func.js : validate password mismatch
 *   TC-UI-03 → join_func.js     : validate empty quiz code
 *   TC-UI-04 → join_func.js     : validate wrong quiz code (not in storage)
 *   TC-UI-05 → play_func.js     : select answer → update selected state
 */

// ─────────────────────────────────────────────────────────────────────────────
// ── SHARED HELPERS (จำลอง localStorage ที่ใช้ในทุกหน้า) ──────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * สร้าง mock localStorage พร้อมข้อมูลเริ่มต้น
 * @param {Object} initialData  - key/value ที่ต้องการตั้งค่าล่วงหน้า
 * @returns {Object} - object ที่มี getItem / setItem / removeItem
 */
function createMockStorage(initialData = {}) {
  const store = {};
  for (const [k, v] of Object.entries(initialData)) {
    store[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return {
    getItem:    (key) => (key in store ? store[key] : null),
    setItem:    (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    _store:     store,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ── UI LOGIC ──────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ฟังก์ชันด้านล่างนำมาจากไฟล์ JS ที่มีอยู่จริง (login_func.js, register_func.js ฯลฯ)
// เพื่อทดสอบแยกจาก browser โดยไม่ต้องโหลด HTML

/**
 * TC-UI-01 | login_func.js
 * validateLoginForm(username, password)
 * → คืน { ok: true } หรือ { ok: false, error: '...' }
 */
function validateLoginForm(username, password) {
  if (!username.trim() || !password) {
    return { ok: false, error: 'กรุณากรอก Username และ Password' };
  }
  return { ok: true, error: '' };
}

/**
 * TC-UI-02 | register_func.js
 * validateRegisterForm({ username, password, confirmPassword })
 * → คืน { ok: true } หรือ { ok: false, field: '...', error: '...' }
 */
function validateRegisterForm({ username, password, confirmPassword }) {
  if (username.trim().length < 4) {
    return { ok: false, field: 'userError', error: 'Username ต้องอย่างน้อย 4 ตัวอักษร' };
  }
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPattern.test(password)) {
    return { ok: false, field: 'passError', error: 'Password ต้องมี A-Z, a-z และตัวเลข อย่างน้อย 8 ตัว' };
  }
  if (password !== confirmPassword) {
    return { ok: false, field: 'confirmError', error: 'Confirm Password ไม่ตรงกัน' };
  }
  return { ok: true, error: '' };
}

/**
 * TC-UI-03 & TC-UI-04 | join_func.js
 * validateJoinCode(code, storage)
 * → คืน { ok: true, quiz } หรือ { ok: false, error: '...' }
 */
function validateJoinCode(code, storage) {
  if (!code || !code.trim()) {
    return { ok: false, error: 'กรุณากรอกรหัสข้อสอบ' };
  }
  const quizzes = JSON.parse(storage.getItem('myQuizzes')) || [];
  const found   = quizzes.find(q => q.code === code.trim());
  if (!found) {
    return { ok: false, error: 'ไม่พบรหัสข้อสอบนี้' };
  }
  if (!found.questions || found.questions.length === 0) {
    return { ok: false, error: 'ข้อสอบนี้ยังไม่มีคำถาม' };
  }
  return { ok: true, quiz: found, error: '' };
}

/**
 * TC-UI-05 | play_func.js
 * QuizState — จัดการ state การตอบคำถามและ progress
 */
function createQuizState(totalQuestions) {
  const answers = Array.from({ length: totalQuestions }, () => []);
  let current   = 0;

  return {
    /** เลือกคำตอบ (single choice) */
    selectAnswer(optionIndex) {
      answers[current] = [optionIndex];
    },
    /** คำตอบของข้อปัจจุบัน */
    getCurrentAnswers() {
      return answers[current];
    },
    /** ตรวจสอบว่าข้อ index นั้นถูกเลือกหรือยัง */
    isSelected(optionIndex) {
      return answers[current].includes(optionIndex);
    },
    /** จำนวนข้อที่ตอบแล้ว */
    answeredCount() {
      return answers.filter(a => a.length > 0).length;
    },
    /** progress เป็น % */
    progressPercent() {
      return Math.round((this.answeredCount() / totalQuestions) * 100);
    },
    /** progress text เหมือนที่แสดงบนหน้าจอ */
    progressText() {
      return `${this.answeredCount()} of ${totalQuestions} answered`;
    },
    /** ไปข้อถัดไป */
    next() {
      if (current < totalQuestions - 1) { current++; return true; }
      return false; // ข้อสุดท้าย → ควร submit
    },
    get currentIndex() { return current; },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  TC-UI-01: Login — validate empty username / password
// ═════════════════════════════════════════════════════════════════════════════
describe('TC-UI-01: Login Form Validation — กรอกข้อมูลว่างเปล่า', () => {

  test('[Expected] error = "กรุณากรอก Username และ Password" เมื่อทั้งสองช่องว่าง', () => {
    const result = validateLoginForm('', '');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('กรุณากรอก Username และ Password');
  });

  test('[Expected] error = "กรุณากรอก..." เมื่อกรอกเฉพาะ username แต่ password ว่าง', () => {
    const result = validateLoginForm('testuser', '');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('กรุณากรอก Username และ Password');
  });

  test('[Expected] ok = true และ error ว่าง เมื่อกรอกครบทั้งสองช่อง', () => {
    const result = validateLoginForm('testuser', 'Pass1234');

    expect(result.ok).toBe(true);
    expect(result.error).toBe('');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  TC-UI-02: Register — validate password mismatch
// ═════════════════════════════════════════════════════════════════════════════
describe('TC-UI-02: Register Form Validation — รหัสผ่านไม่ตรงกัน', () => {

  test('[Expected] field = "confirmError", error = "Confirm Password ไม่ตรงกัน"', () => {
    const result = validateRegisterForm({
      username:        'newuser',
      password:        'Password1',
      confirmPassword: 'WrongPass1',
    });

    expect(result.ok).toBe(false);
    expect(result.field).toBe('confirmError');
    expect(result.error).toBe('Confirm Password ไม่ตรงกัน');
  });

  test('[Expected] field = "passError" เมื่อ password ไม่ผ่าน pattern (ขาด A-Z)', () => {
    const result = validateRegisterForm({
      username:        'newuser',
      password:        'password1',   // ← ไม่มีตัวพิมพ์ใหญ่
      confirmPassword: 'password1',
    });

    expect(result.ok).toBe(false);
    expect(result.field).toBe('passError');
    expect(result.error).toBe('Password ต้องมี A-Z, a-z และตัวเลข อย่างน้อย 8 ตัว');
  });

  test('[Expected] ok = true เมื่อข้อมูลครบถ้วนและ password ตรงกัน', () => {
    const result = validateRegisterForm({
      username:        'newuser',
      password:        'Password1',
      confirmPassword: 'Password1',
    });

    expect(result.ok).toBe(true);
    expect(result.error).toBe('');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  TC-UI-03: Join Quiz — กรอกรหัสว่างเปล่า
// ═════════════════════════════════════════════════════════════════════════════
describe('TC-UI-03: Join Quiz — กรอกรหัสว่างเปล่า', () => {
  let storage;

  beforeEach(() => {
    storage = createMockStorage({ myQuizzes: [] });
  });

  test('[Expected] error = "กรุณากรอกรหัสข้อสอบ" เมื่อ code เป็น empty string', () => {
    const result = validateJoinCode('', storage);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('กรุณากรอกรหัสข้อสอบ');
  });

  test('[Expected] error = "กรุณากรอกรหัสข้อสอบ" เมื่อ code เป็น null', () => {
    const result = validateJoinCode(null, storage);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('กรุณากรอกรหัสข้อสอบ');
  });

  test('[Expected] error = "กรุณากรอกรหัสข้อสอบ" เมื่อ code เป็น whitespace', () => {
    const result = validateJoinCode('   ', storage);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('กรุณากรอกรหัสข้อสอบ');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  TC-UI-04: Join Quiz — กรอกรหัสที่ไม่มีในระบบ
// ═════════════════════════════════════════════════════════════════════════════
describe('TC-UI-04: Join Quiz — กรอกรหัสผิดหรือหมดอายุ', () => {
  let storage;

  beforeEach(() => {
    // mock storage: มี quiz หนึ่งรายการในระบบ
    storage = createMockStorage({
      myQuizzes: [
        {
          code:      'Q1234567890',
          title:     'ทดสอบวิชาคณิตศาสตร์',
          questions: [{ text: 'ข้อที่ 1', options: ['A','B','C','D'], correctAnswers: [0] }],
        },
      ],
    });
  });

  test('[Expected] error = "ไม่พบรหัสข้อสอบนี้" เมื่อกรอก code ที่ไม่มีในระบบ', () => {
    const result = validateJoinCode('XXXXXX', storage);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('ไม่พบรหัสข้อสอบนี้');
  });

  test('[Expected] ok = true และได้ quiz object คืนมา เมื่อกรอก code ถูกต้อง', () => {
    const result = validateJoinCode('Q1234567890', storage);

    expect(result.ok).toBe(true);
    expect(result.error).toBe('');
    expect(result.quiz).toBeDefined();
    expect(result.quiz.title).toBe('ทดสอบวิชาคณิตศาสตร์');
  });

  test('[Expected] error = "ข้อสอบนี้ยังไม่มีคำถาม" เมื่อ quiz ไม่มี questions', () => {
    // เพิ่ม quiz ที่ไม่มีคำถาม
    const quizzes = JSON.parse(storage.getItem('myQuizzes'));
    quizzes.push({ code: 'Q_EMPTY', title: 'ว่างเปล่า', questions: [] });
    storage.setItem('myQuizzes', JSON.stringify(quizzes));

    const result = validateJoinCode('Q_EMPTY', storage);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('ข้อสอบนี้ยังไม่มีคำถาม');
  });

});

// ═════════════════════════════════════════════════════════════════════════════
//  TC-UI-05: Play Quiz — select answer → update UI state
// ═════════════════════════════════════════════════════════════════════════════
describe('TC-UI-05: Play Quiz — กดเลือกคำตอบแล้ว state ต้องอัปเดต', () => {
  let state;

  beforeEach(() => {
    // จำลอง quiz ที่มี 3 คำถาม
    state = createQuizState(3);
  });

  test('[Expected] isSelected(1) = true หลังจากเลือกตัวเลือก B (index 1)', () => {
    state.selectAnswer(1);  // เลือกตัวเลือก B

    // Expected: ตัวเลือก B ถูกเลือก
    expect(state.isSelected(1)).toBe(true);
  });

  test('[Expected] ตัวเลือกอื่น (A, C, D) isSelected = false หลังเลือก B', () => {
    state.selectAnswer(1);

    // Expected: Single choice — เลือกได้แค่ 1 ข้อ ตัวอื่นต้องไม่ถูกเลือก
    expect(state.isSelected(0)).toBe(false);
    expect(state.isSelected(2)).toBe(false);
    expect(state.isSelected(3)).toBe(false);
  });

  test('[Expected] คำตอบเปลี่ยนได้ → เลือก A แล้วเปลี่ยนเป็น C', () => {
    state.selectAnswer(0);  // เลือก A ก่อน
    expect(state.isSelected(0)).toBe(true);

    state.selectAnswer(2);  // เปลี่ยนใจเลือก C
    // Expected: A ไม่ถูกเลือกแล้ว, C ถูกเลือกแทน
    expect(state.isSelected(0)).toBe(false);
    expect(state.isSelected(2)).toBe(true);
  });

  test('[Expected] progressText = "1 of 3 answered" หลังตอบข้อแรก', () => {
    state.selectAnswer(0);

    // Expected: progress bar text แสดงจำนวนที่ตอบแล้วถูกต้อง
    expect(state.progressText()).toBe('1 of 3 answered');
  });

  test('[Expected] progressPercent = 100 เมื่อตอบครบทุกข้อ', () => {
    state.selectAnswer(0);  // ข้อ 1
    state.next();
    state.selectAnswer(1);  // ข้อ 2
    state.next();
    state.selectAnswer(2);  // ข้อ 3

    // Expected: progress เต็ม 100%
    expect(state.progressPercent()).toBe(100);
    expect(state.answeredCount()).toBe(3);
  });

});
