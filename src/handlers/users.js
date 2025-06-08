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
        return h.response({
          status: 'fail',
          message: 'Email atau password salah',
        }).code(401);
      }

      const user = users[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return h.response({
          status: 'fail',
          message: 'Email atau password salah',
        }).code(401);
      }

      return {
        status: 'success',
        message: 'Login berhasil',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return h.response({
        status: 'error',
        message: 'Gagal login',
        detail: error.message,
      }).code(500);
    }
  }
};

module.exports = usersHandler;