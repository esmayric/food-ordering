const mysql = require('mysql2');
const env = require('./env');

const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL bağlantı hatası:', err.message);
    process.exit(1);
  }

  console.log('✅ MySQL bağlantısı başarılı!');
  connection.release();
});

module.exports = pool;
