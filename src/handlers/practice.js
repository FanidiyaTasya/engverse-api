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
      const questions = loadQuestions(section);
      const sessionId = nanoid();
      const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.execute(
        'INSERT INTO practice_sessions (id, user_id, section, started_at) VALUES (?, ?, ?, ?)',
        [sessionId, userId, section, startedAt]
      );

      return h.response({
        status: 'success',
        message: 'Sesi latihan berhasil dimulai',
        data: {
          sessionId,
          userId,
          startedAt,
          section,
          questions,
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
         VALUES (?, ?, ?, ?, ?)`,
        [answerId, sessionId, questionId, choiceLabel, isCorrect ? 1 : 0] // ini typo, harusnya isCorrect
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
  },
};

module.exports = practiceHandler;
