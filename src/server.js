const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const pool = require('./utils/database');

const init = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Koneksi database berhasil');
  } catch (error) {
    console.error('❌ Koneksi database gagal:', error.message);
    process.exit(1);
  }

  const server = Hapi.server({
    port: Number(process.env.PORT) || 3000,
    // host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        additionalHeaders: ['authorization'],
      },
    },
  });

  server.route(routes);

  await server.start();
  console.log(`✅ Server berjalan di ${server.info.uri}`);
};

init();