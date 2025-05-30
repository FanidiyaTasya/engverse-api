const pool = require('../utils/database');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

const saltRounds = 10;

const usersHandler = {
  register: async (request, h) => {
    const { name, email, password } = request.payload;
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return h.response({
        status: 'fail',
        message: 'Email sudah digunakan'
      }).code(400);
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const id = nanoid();
    const createdAt = new Date().toISOString();
    await pool.execute(
      'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, createdAt]
    );

    return h.response({
      status: 'success',
      message: 'User berhasil register'
    }).code(201);
  },

  login: async (request, h) => {
    const { email, password } = request.payload;
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return h.response({
        status: 'fail',
        message: 'Email atau password salah'
      }).code(401);
    }

    const user = users[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return h.response({
        status: 'fail',
        message: 'Email atau password salah'
      }).code(401);
    }

    return {
      status: 'success',
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }
};

module.exports = usersHandler;