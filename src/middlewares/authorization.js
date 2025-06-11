const pool = require('../utils/database');

const authMiddleware = async (request, h) => {
  const authHeader = request.headers.authorization;
  // console.log('Authorization Header:', request.headers.authorization);

  if (!authHeader) {
    return h.response({ status: 'fail', message: 'Token tidak ditemukan' }).code(401).takeover();
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE token = ?', [token]);
    if (rows.length === 0) {
      return h.response({ status: 'fail', message: 'Token tidak valid' }).code(401).takeover();
    }

    request.user = { id: rows[0].id };
    return h.continue;
  } catch (error) {
    console.error('Error saat verifikasi token:', error);
    return h.response({ status: 'error', message: 'Gagal memverifikasi token' }).code(500).takeover();
  }
};

module.exports = authMiddleware;