
## โครงการพัฒนาเว็บทำข้อสอบออนไลน์ (quizWeb)

---
## รายชื่อสมาชิกกลุ่ม

1. นางสาวแพรวปภัสสร ว่องธนากิจ 67102010524
2. นางสาวภัทรธิดา จารุจิตจำเริญ 67102010525
3. นางสาวศรุชา วิริยะจิตต์ 67102010531
---

## 1. ข้อมูลเดิมจาก phase 1 and 2
* Phase 1: วางแนวคิดสิ่งที่อยากทำ กำหนดขอบเขต รวบรวมฟีเจอร์ วางลำดับการใช้งานของผู้ใช้

* Phase 2: ออกแบบหน้าตาเว็บ จัดวางตำแหน่งปุ่มและเนื้อหา ทำตัวต้นแบบที่กดคลิกเชื่อมโยงหน้าต่างๆ ได้เพื่อให้เห็นภาพของตัวเว็บ

## 2. อธิบายการทำงานของ program (เช่น มี get กี่ method, post กี่ method, ใช้ template อย่างไร, มีการเรียก API หรือไม่อย่างไร, มีการคำนวนอะไร หรือ graph อะไร)

* **ฟังก์ชันหลักและการประมวลผล**
โปรแกรมทำงานผ่าน 3 ฟังก์ชันหลักที่จัดการข้อมูลคำถามและคำตอบ ดังนี้:

  - checkAnswer(user, correct): ทำหน้าที่เปรียบเทียบคำตอบที่ผู้ใช้ส่งมากับเฉลยในรูปแบบ Boolean (true/false)

  - calculateScore(answers, correctAnswers): ใช้ลูป (for loop) ในการตรวจทานชุดคำตอบทั้งหมด โดยจะเพิ่มค่าตัวแปร score ทีละ 1 คะแนน เมื่อคำตอบในตำแหน่งนั้นๆ ตรงกับเฉลย

  - getQuestion(questions, index): ระบบดึงข้อมูลคำถามตามลำดับที่ระบุ โดยมีการตรวจสอบเงื่อนไข (Validation) เพื่อป้องกันข้อผิดพลาดกรณี Index น้อยกว่า 0 หรือเกินจำนวนคำถามที่มีอยู่จริง (จะคืนค่าเป็น null)

  - มีการเรียก API โดยมีการใช้ Google Fonts API ผ่าน Link Tag เพื่อดึงฟอนต์ 'Prompt' มาใช้ในการจัดการหน้าเว็บ

  - ใช้โครงสร้างข้อมูลแบบ Array ในการเก็บชุดคำถามและคำตอบ
  - ใช้ระบบ Module Exports เพื่อรองรับการเรียกใช้ฟังก์ชันข้ามไฟล์และการทำ Testing

---

## 3. Test cases
### 3.1 ตาราง Unit Test Cases (Data Structure)
| TC | Function       | Input                          | Expected Result | Actual Result | Status |
|----|----------------|--------------------------------|-----------------|---------------|--------|
| 1  | calculateScore | ['A','B','C'],['A','B','C']    | 3               | 3             | Pass   |
| 2  | calculateScore | ['A','A','A'],['B','B','B']    | 0               | 0             | Pass   |
| 3  | calculateScore | ['A','B','C'],['A','C','C']    | 2               | 2             | Pass   |
| 4  | calculateScore | [],[]                          | 0               | 0             | Pass   |
| 5  | calculateScore | ['A'],['A','B']                | 1               | 1             | Pass   |
| 6  | getQuestion    | ['Q1','Q2','Q3'],1             | 'Q2'            | 'Q2'          | Pass   |
| 7  | getQuestion    | ['Q1','Q2'],-1                 | null            | null          | Pass   |
| 8  | getQuestion    | ['Q1','Q2'],5                  | null            | null          | Pass   |
| 9  | getQuestion    | [],0                           | null            | null          | Pass   |
| 10 | calculateScore | [null,'B'],['A','B']           | 1               | 1             | Pass   |

### 3.2 ตาราง Unit Test Cases (Function / Class อื่น)
| TC | Function    | Input       | Expected Result | Actual Result | Status |
|----|-------------|-------------|-----------------|---------------|--------|
| 11 | checkAnswer | 'A','A'     | true            | true          | Pass   |
| 12 | checkAnswer | 'A','B'     | false           | false         | Pass   |
| 13 | checkAnswer | 'a','A'     | false           | false         | Pass   |

 ### 3.3 ตัวอย่าง Test Case Code
const {
  checkAnswer,
  calculateScore,
  getQuestion
} = require('../quiz');

describe('Quiz Web App Test (11 Cases)', () => {

  //  1
  test('Correct answer returns true', () => {
    expect(checkAnswer('A', 'A')).toBe(true);
  });

  //  2
  test('Wrong answer returns false', () => {
    expect(checkAnswer('A', 'B')).toBe(false);
  });

  //  3
  test('Case sensitive', () => {
    expect(checkAnswer('a', 'A')).toBe(false);
  });

  //  4
  test('Calculate full score', () => {
    expect(calculateScore(['A','B','C'], ['A','B','C'])).toBe(3);
  });

  //  5
  test('Calculate zero score', () => {
    expect(calculateScore(['A','A','A'], ['B','B','B'])).toBe(0);
  });

  //  6
  test('Calculate partial score', () => {
    expect(calculateScore(['A','B','C'], ['A','C','C'])).toBe(2);
  });

  //  7
  test('Empty arrays', () => {
    expect(calculateScore([], [])).toBe(0);
  });

  //  8
  test('Get valid question', () => {
    const questions = ['Q1','Q2','Q3'];
    expect(getQuestion(questions, 1)).toBe('Q2');
  });

  //  9
  test('Get question out of bounds (negative)', () => {
    const questions = ['Q1','Q2'];
    expect(getQuestion(questions, -1)).toBe(null);
  });

  //  10
  test('Get question out of bounds (too large)', () => {
    const questions = ['Q1','Q2'];
    expect(getQuestion(questions, 5)).toBe(null);
  });

  //  11
  test('Handles different array lengths', () => {
    expect(calculateScore(['A','B'], ['A','B','C'])).toBe(2);
  });

});

### 3.4 Test Coverage Report
![alt text](readme_images/image.png)
แสดงให้เห็นว่า:
ไม่มีส่วนของโค้ดที่ไม่ได้รับการทดสอบ (No dead code)
ลดความเสี่ยงของ bug ใน logic หลักของระบบ
รองรับการพัฒนาใน Phase ถัดไปได้ง่าย

---

## 4. สิ่งที่ยังไม่เสร็จสมบูรณ์
* **Frontend:** โครงสร้างเว็บและ UI/UX เสร็จสมบูรณ์ พร้อมแสดงฟังก์ชันและฟีเจอร์หลักทั้งหมด

* **Backend:** อยู่ระหว่างการพัฒนาส่วนระบบหลังบ้าน การจัดการฐานข้อมูล และการเชื่อมต่อ API (Data Integration) เพื่อให้ระบบทำงานได้อย่างเต็มรูปแบบ

---

## 5. Website screenshot
- หน้า index
![Index_1](readme_images/Index.png)
- หน้า index(ต่อ)
![Index_2](readme_images/Index_2.png)

- หน้า login
![Login](readme_images/Login.png)

- หน้า register
![Register](readme_images/Register.png)

- หน้า dashboard
![Register](readme_images/dashboard.png)

- หน้า join quiz
![Register](readme_images/join.png)

- หน้า create quiz
![Register](readme_images/create.png)

- หน้า edit quiz
![edit](readme_images/edit1.png)
- หน้า edit(ต่อ 1)
![edit](readme_images/edit2.png)
- หน้า edit(ต่อ 2)
![edit](readme_images/edit3.png)

- หน้า play quiz
![edit](readme_images/play.png)

- หน้า admin
![Register](readme_images/admin.png)

---

## 6. สิ่งเปลี่ยนแปลงจาก รายงาน phase 1 and 2 และ เหดุผลที่เปลี่ยน
**มีการพัฒนาจากแผนงานสู่การปฏิบัติจริง :**

* **การพัฒนา:** เปลี่ยนจากโครงร่างไอเดียและดีไซน์ใน Figma (Phase 1-2) มาเป็นการ เขียน Code จริง จนตัวเว็บเริ่มเป็นรูปเป็นร่างตามที่ออกแบบไว้
* **ฟังก์ชัน & คุณภาพ:** นำฟังก์ชันที่เคยร่างไว้มาทำให้ใช้งานได้จริง (Functional) แม้จะยังไม่สมบูรณ์ 100% แต่มีการเพิ่ม Test Case เข้ามาช่วยตรวจสอบความถูกต้องควบคู่ไปด้วย
* **การบริหารจัดการ:** ปรับปรุงกระบวนการทำงานในทีมให้มีระเบียบมากขึ้น แบ่งหน้าที่ชัดเจนว่าใครรับผิดชอบส่วนไหน และวางแผนการพัฒนาในลำดับถัดไปอย่างเป็นระบบ
* **เหตุผลที่เปลี่ยน:** เพื่อเปลี่ยนจาก "แนวคิด" ให้กลายเป็น "ซอฟต์แวร์ที่ใช้งานได้" โดยเน้นความสำคัญที่โครงสร้างระบบ การทดสอบ และการทำงานร่วมกันอย่างมืออาชีพ

---

## 7. อธิบายกระบวนการทำงาน โดยใช้ process, methods, and tools ที่เพิ่มเติมจาก phase 1 and 2 เช่น การบริหาร project, การ monitor build, การจัดการ bugs  
* **การจัดการคุณภาพโค้ดและ Bugs**
  - Automated Unit Testing: มีการใช้ชุดทดสอบ (Test Cases) จำนวน 11 กรณี ผ่านไฟล์ quiz.test.js เพื่อตรวจสอบความถูกต้องของ Logic ก่อนนำไปใช้งานจริง ซึ่งช่วยดักจับ Bug ในส่วนการคำนวณคะแนนและการดึงข้อมูลคำถาม

* **กระบวนการพัฒนา**
  - จัดระเบียบโค้ดโดยใช้ระบบ module.exports เพื่อแยกส่วน Logic (quiz.js) ออกจากส่วนทดสอบ (quiz.test.js)

* **เครื่องมือที่ใช้**
  - Jest / Istanbul: ใช้สำหรับรันชุดทดสอบและสร้างรายงานผลการทดสอบ
  - VS Code Search & Monitor: ใช้ฟีเจอร์การค้นหาและตรวจสอบสถานะไฟล์ เพื่อติดตามการเปลี่ยนแปลงของไฟล์ README.md และโค้ดในโปรเจกต์

---

## 8. สรุปการประชุม Retrospective Phase 3

ทีมงานได้มีการจัดประชุม Retrospective หลังการดำเนินงานในช่วงการออกแบบและวางโครงสร้าง โดยมีข้อสรุปดังนี้

* **สิ่งที่ทำได้ดี:** 
* **สิ่งที่ควรปรับปรุง:** 
* **แนวทางการพัฒนาในอนาคต:** 

ลิงก์วิดีโอ Retrospective : 

---