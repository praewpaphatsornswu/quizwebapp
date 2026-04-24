const {
  checkAnswer,
  calculateScore,
  getQuestion
} = require('../quiz');

describe('Quiz Web App Test (11 Cases)', () => {
  // 1 ทดสอบว่าเมื่อคำตอบถูกต้อง (A === A) ต้องคืนค่า true
  test('Correct answer returns true', () => {
    expect(checkAnswer('A', 'A')).toBe(true);
  });

  // 2 ทดสอบว่าเมื่อคำตอบผิด (A !== B) ต้องคืนค่า false
  test('Wrong answer returns false', () => {
    expect(checkAnswer('A', 'B')).toBe(false);
  });

  // 3 ทดสอบว่าฟังก์ชันแยกแยะตัวพิมพ์เล็ก/ใหญ่ ('a' !== 'A') ต้องคืนค่า false
  test('Case sensitive', () => {
    expect(checkAnswer('a', 'A')).toBe(false);
  });

  // 4 ทดสอบคำนวณคะแนนเมื่อตอบถูกทุกข้อ ต้องได้คะแนนเต็ม 3
  test('Calculate full score', () => {
    expect(calculateScore(['A','B','C'], ['A','B','C'])).toBe(3);
  });

  // 5 ทดสอบคำนวณคะแนนเมื่อตอบผิดทุกข้อ ต้องได้คะแนน 0
  test('Calculate zero score', () => {
    expect(calculateScore(['A','A','A'], ['B','B','B'])).toBe(0);
  });

  // 6 ทดสอบคำนวณคะแนนเมื่อตอบถูกบางข้อ (ถูก 2 จาก 3) ต้องได้คะแนน 2
  test('Calculate partial score', () => {
    expect(calculateScore(['A','B','C'], ['A','C','C'])).toBe(2);
  });

  // 7 ทดสอบคำนวณคะแนนเมื่อส่ง array ว่างทั้งคู่ ต้องได้คะแนน 0 (ไม่ crash)
  test('Empty arrays', () => {
    expect(calculateScore([], [])).toBe(0);
  });

  // 8 ทดสอบดึงคำถามจาก index ที่ถูกต้อง (index 1 = 'Q2') ต้องคืนค่า 'Q2'
  test('Get valid question', () => {
    const questions = ['Q1','Q2','Q3'];
    expect(getQuestion(questions, 1)).toBe('Q2');
  });

  // 9 ทดสอบดึงคำถามด้วย index ติดลบ (-1) ต้องคืนค่า null
  test('Get question out of bounds (negative)', () => {
    const questions = ['Q1','Q2'];
    expect(getQuestion(questions, -1)).toBe(null);
  });

  // 10 ทดสอบดึงคำถามด้วย index เกินขนาด array (5 เกินกว่า length 2) ต้องคืนค่า null
  test('Get question out of bounds (too large)', () => {
    const questions = ['Q1','Q2'];
    expect(getQuestion(questions, 5)).toBe(null);
  });

  // 11 ทดสอบว่าเมื่อ array คำตอบสั้นกว่า array เฉลย จะยังคำนวณได้ถูกต้อง ต้องได้คะแนน 2
  test('Handles different array lengths', () => {
    expect(calculateScore(['A','B'], ['A','B','C'])).toBe(2);
  });
});
