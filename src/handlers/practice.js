const fs = require('fs');
const pool = require('../utils/database');
const { nanoid } = require('nanoid');
const loadQuestions = require('../utils/loadQuestions');
const path = require('path');

const practiceHandler = {
  startPracticeSession: async (request, h) => {
    try {
      const { section } = request.params;
      const userId = request.user.id;

      const allData = loadQuestions(section);
      const allQuestions = allData.questions;

      const selectedQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
      const questionIds = selectedQuestions.map((q) => q.id);

      const sessionId = nanoid();
      const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.execute(
        'INSERT INTO practice_sessions (id, user_id, section, started_at, question_ids) VALUES (?, ?, ?, ?, ?)',
        [sessionId, userId, section, startedAt, JSON.stringify(questionIds)]
      );

      return h.response({
        status: 'success',
        message: 'Sesi latihan berhasil dimulai',
        data: {
          sessionId,
          userId,
          startedAt,
          section,
        }
      });
    } catch (error) {
      console.error(error);
      return h.response({
        status: 'error',
        message: 'Gagal memulai sesi latihan',
        detail: error.message,
      }).code(500);
    }
  },

  getPracticeSession: async (request, h) => {
    const { sessionId } = request.params;
    const [rows] = await pool.execute(
      'SELECT section, question_ids, submitted_at FROM practice_sessions WHERE id = ?',
      [sessionId]
    );

    if (!rows.length) {
      return h
        .response({
          status: 'fail',
          message: 'Sesi tidak ditemukan',
        })
        .code(404);
    }

    const { section, question_ids: questionIdsRaw, submitted_at: submittedAt } = rows[0];
    const questionIds = JSON.parse(questionIdsRaw);
    const allQuestions = loadQuestions(section).questions;

    const [answerRows] = await pool.execute(
      'SELECT question_id, choice_label FROM user_answer WHERE session_id = ?',
      [sessionId]
    );

    const userAnswers = {};
    for (const row of answerRows) {
      userAnswers[row.question_id] = row.choice_label;
    }

    const questions = questionIds
      .map((id) => {
        const question = allQuestions.find((q) => q.id === id);
        if (!question) return null;

        return {
          ...question,
          userAnswer: userAnswers[`${section}-${id}`] || null,
        };
      })
      .filter(Boolean);

    return h.response({
      status: 'success',
      data: {
        sessionId,
        section,
        submittedAt: submittedAt,
        questions,
      },
    });
  },

  submitAnswer: async (request, h) => {
    try {
      const { sessionId, questionId, choiceLabel } = request.payload;

      if (!sessionId || !questionId || !choiceLabel) {
        return h.response({
          status: 'fail',
          message: 'Data jawaban tidak lengkap',
        }).code(400);
      }

      const [section] = questionId.split('-');
      const dataPath = path.join(__dirname, `../data/${section}.json`);

      if (!fs.existsSync(dataPath)) {
        return h.response({
          status: 'fail',
          message: 'Section tidak ditemukan',
        }).code(404);
      }

      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(fileContent);
      const questions = data.questions;

      const question = questions.find((q) => String(q.id) === String(questionId.split('-')[1]));
      if (!question) {
        return h.response({
          status: 'fail',
          message: 'Soal tidak ditemukan',
        }).code(404);
      }

      const isCorrect = question.answer === choiceLabel;
      const answerId = nanoid();

      await pool.execute(
        `INSERT INTO user_answer (id, session_id, question_id, choice_label, is_correct)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          choice_label = VALUES(choice_label),
          is_correct = VALUES(is_correct)`,
        [answerId, sessionId, questionId, choiceLabel, isCorrect ? 1 : 0]
      );

      return h.response({
        status: 'success',
        message: 'Jawaban berhasil disimpan',
        data: {
          answerId,
          isCorrect,
        },
      });
    } catch (error) {
      console.error(error);
      return h.response({
        status: 'error',
        message: 'Gagal menyimpan jawaban',
      }).code(500);
    }
  },

  submitSession: async (request, h) => {
    try {
      const { sessionId } = request.payload;

      if (!sessionId) {
        return h.response({ status: 'fail', message: 'Session ID wajib diisi' }).code(400);
      }

      const [rows] = await pool.execute(
        'SELECT COUNT(*) AS correctCount FROM user_answer WHERE session_id = ? AND is_correct = 1',
        [sessionId]
      );

      const correctCount = rows[0].correctCount;
      const submittedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.execute(
        'UPDATE practice_sessions SET submitted_at = ?, correct_count = ? WHERE id = ?',
        [submittedAt, correctCount, sessionId]
      );

      return h.response({
        status: 'success',
        message: 'Sesi latihan selesai',
        data: { sessionId, submittedAt, correctCount },
      });
    } catch (error) {
      console.error(error);
      return h.response({ status: 'error', message: 'Gagal submit sesi latihan' }).code(500);
    }
  }
};

module.exports = practiceHandler;
