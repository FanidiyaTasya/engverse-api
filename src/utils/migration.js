const pool = require('./database');

(async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        token VARCHAR(200) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        started_at DATETIME,
        question_ids TEXT,
        submitted_at DATETIME,
        section ENUM('reading', 'structure', 'listening'),
        correct_count INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS recomendations (
        id VARCHAR(50) PRIMARY KEY,
        session_id VARCHAR(50),
        reccomendation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_answer (
        id VARCHAR(50) PRIMARY KEY,
        session_id VARCHAR(50),
        question_id VARCHAR(50),
        choice_label VARCHAR(10),
        is_correct BOOLEAN,
        UNIQUE KEY unique_answer (session_id, question_id)
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
