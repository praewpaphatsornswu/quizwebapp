const {
  checkAnswer,
  calculateScore,
  getQuestion
} = require("../quiz");

// ------------------ TEST ------------------

describe("Quiz App Test Cases", () => {

  // 1
  test("correct answer returns true", () => {
    expect(checkAnswer("A", "A")).toBe(true);
  });

  // ✅ 2
  test("wrong answer returns false", () => {
    expect(checkAnswer("B", "A")).toBe(false);
  });

  // 3
  test("empty answer returns false", () => {
    expect(checkAnswer("", "A")).toBe(false);
  });

  // 4
  test("calculate full score", () => {
    const user = ["A","B","C"];
    const correct = ["A","B","C"];
    expect(calculateScore(user, correct)).toBe(3);
  });

  // 5
  test("calculate partial score", () => {
    const user = ["A","B","D"];
    const correct = ["A","B","C"];
    expect(calculateScore(user, correct)).toBe(2);
  });

  // 6
  test("calculate zero score", () => {
    const user = ["D","D","D"];
    const correct = ["A","B","C"];
    expect(calculateScore(user, correct)).toBe(0);
  });

  // 7
  test("get valid question", () => {
    const questions = ["Q1","Q2","Q3"];
    expect(getQuestion(questions, 1)).toBe("Q2");
  });

  // 8
  test("get question out of range", () => {
    const questions = ["Q1","Q2"];
    expect(getQuestion(questions, 5)).toBe(null);
  });

  // 9
  test("get question negative index", () => {
    const questions = ["Q1","Q2"];
    expect(getQuestion(questions, -1)).toBe(null);
  });

  // 10
  test("empty question list", () => {
    const questions = [];
    expect(getQuestion(questions, 0)).toBe(null);
  });

  //11 
  test("different length arrays (score)", () => {
    const user = ["A","B"];
    const correct = ["A","B","C"];
    expect(calculateScore(user, correct)).toBe(2);
  });

});