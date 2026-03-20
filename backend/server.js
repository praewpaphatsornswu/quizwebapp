const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// เก็บข้อสอบชั่วคราว (แทน DB)
const quizzes = {};

// สร้างข้อสอบ
app.post("/api/quizzes", (req, res) => {
  const { title, questions } = req.body;

  const code = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  quizzes[code] = { title, questions };

  res.json({ code });
});

// ดึงข้อสอบด้วยรหัส
app.get("/api/quizzes/:code", (req, res) => {
  const quiz = quizzes[req.params.code];

  if (!quiz) {
    return res.status(404).json({ message: "ไม่พบข้อสอบ" });
  }

  res.json(quiz);
});

// เปิดเซิร์ฟเวอร์
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
