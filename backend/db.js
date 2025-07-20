require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // BURADAN BAŞLAYAN YENİ EKLENTİLER //
  ssl: {
    rejectUnauthorized: false // Render gibi cloud veritabanları için bu çok önemli!
  }
  // YENİ EKLENTİLERİN SONU //
});

// BURADAN BAŞLAYAN YENİ EKLENTİLER //
// Veritabanı bağlantısını test etme ve hataları yakalama
pool.connect((err, client, release) => {
  if (err) {
    console.error('DATABASE CONNECTION ERROR:', err.message);
    console.error('DATABASE CONNECTION ERROR STACK:', err.stack);
    // Bu noktada uygulamadan çıkmak, Render loglarında hatayı görmenizi sağlar
    process.exit(1); 
  } else {
    console.log('Successfully connected to PostgreSQL on Render!');
    release(); // Bağlantıyı havuza geri bırak
  }
});
// YENİ EKLENTİLERİN SONU //


module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};