const pool = require('../utils/database');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

const saltRounds = 10;

const usersHandler = {
  register: async (request, h) => {
    try {
      const { name, email, password } = request.payload;
      const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length > 0) {
        return h.response({
          status: 'fail',
          message: 'Email sudah digunakan',
        }).code(400);
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const id = nanoid();
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.execute(
        'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, name, email, hashedPassword, createdAt]
      );
      return h.response({
        status: 'success',
        message: 'User berhasil register',
      }).code(201);

    } catch (error) {
      console.error('Register error:', error);
      return h.response({
        status: 'error',
        message: 'Gagal mendaftarkan user',
        detail: error.message,
      }).code(500);
    }
  },

  login: async (request, h) => {
    try {
      const { email, password } = request.payload;
      const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return h.response({ status: 'fail', message: 'Email atau password salah' }).code(401);
      }

      const user = users[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return h.response({ status: 'fail', message: 'Email atau password salah' }).code(401);
      }

      const token = nanoid(64);
      await pool.execute('UPDATE users SET token = ? WHERE id = ?', [token, user.id]);
      return h.response({
        status: 'success',
        message: 'Login berhasil',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            token: user.token,
          },
          token,
        },
      });
    } catch (error) {
      console.error(error);
      return h.response({ status: 'error', message: 'Gagal login' }).code(500);
    }
  },
  logout: async (request, h) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return h.response({ status: 'fail', message: 'Token tidak ditemukan' }).code(401);
      }

      const token = authHeader.replace('Bearer ', '');

      const [users] = await pool.execute('SELECT * FROM users WHERE token = ?', [token]);
      if (users.length === 0) {
        return h.response({ status: 'fail', message: 'Token tidak valid' }).code(401);
      }

      await pool.execute('UPDATE users SET token = NULL WHERE id = ?', [users[0].id]);

      return h.response({
        status: 'success',
        message: 'Logout berhasil',
      });
    } catch (error) {
      console.error(error);
      return h.response({ status: 'error', message: 'Gagal logout' }).code(500);
    }
  }
};

module.exports = usersHandler;