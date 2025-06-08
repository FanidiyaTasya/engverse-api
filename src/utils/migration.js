const pool = require('./utils/database');

(async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correct_count INT DEFAULT 0,
        user_id INT,
        started_at DATETIME,
        submitted_at DATETIME,
        section ENUM('reading', 'structure', 'listening'),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reccomendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        reccomendation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_answer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        question_id INT,
        choice_label VARCHAR(10),
        is_correct BOOLEAN,
        FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Semua tabel berhasil dibuat!');
  } catch (err) {
    console.error('❌ Error membuat tabel:', err);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    process.exit();
  }
})();
