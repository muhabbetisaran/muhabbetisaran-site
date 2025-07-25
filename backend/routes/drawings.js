const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'muhabbetisaran/drawings', // Cloudinary'de görsellerin yükleneceği klasör
                                       // Lütfen bu klasör adının Cloudinary'deki Assets altında istediğiniz gibi olduğundan emin olun.
    format: async (req, file) => { // Yüklenecek dosya formatını dinamik olarak belirle
      const ext = path.extname(file.originalname).substring(1); // Dosya uzantısını al (örn: 'jpg', 'png')
      return ext;
    },
    public_id: (req, file) => Date.now() + '-' + path.parse(file.originalname).name, // Benzersiz public_id oluşturma
  },
});
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);


const upload = multer({ storage: storage });

// List all drawings
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM nisa.drawings ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching drawings:', err); // Hataları logla
    res.status(500).json({ error: err.message });
  }
});

// Add a new drawing (with images)
router.post('/', upload.fields([
  { name: 'drawing', maxCount: 1 },
  { name: 'original', maxCount: 1 }
]), async (req, res) => {
  const { note } = req.body;
  let drawing_url = req.files['drawing'] ? `/public/uploads/${req.files['drawing'][0].filename}` : null;
  let original_url = req.files['original'] ? `/public/uploads/${req.files['original'][0].filename}` : null;
  try {
    if (req.files['drawing'] && req.files['drawing'][0]) {
      drawing_url = req.files['drawing'][0].path;
    }
    if (req.files['original'] && req.files['original'][0]) {
      original_url = req.files['original'][0].path;
    }

    const result = await db.query(
      'INSERT INTO nisa.drawings (drawing_url, original_url, note) VALUES ($1, $2, $3) RETURNING *',
      [drawing_url, original_url, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Drawing upload/save error:', err); // Hataları logla
    res.status(500).json({ error: err.message });
  }
});

// Get a single drawing
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM nisa.drawings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching single drawing:', err); // Hataları logla
    res.status(500).json({ error: err.message });
  }
});

// Edit a drawing (can update images and/or note)
router.put('/:id', upload.fields([
  { name: 'drawing', maxCount: 1 },
  { name: 'original', maxCount: 1 }
]), async (req, res) => {
  const id = req.params.id;
  const { note } = req.body;
  let drawing_url, original_url;


  try {
    // Mevcut veritabanı girişini al. Yeni dosya yüklenmezse eski URL'leri korumak için.
    const current = await db.query('SELECT drawing_url, original_url FROM nisa.drawings WHERE id = $1', [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    // Eğer yeni bir 'drawing' dosyası yüklendiyse Cloudinary URL'sini kullan, yoksa mevcut URL'yi koru
    drawing_url = req.files['drawing'] && req.files['drawing'][0] ? req.files['drawing'][0].path : current.rows[0].drawing_url;
    // Eğer yeni bir 'original' dosyası yüklendiyse Cloudinary URL'sini kullan, yoksa mevcut URL'yi koru
    original_url = req.files['original'] && req.files['original'][0] ? req.files['original'][0].path : current.rows[0].original_url;
    const result = await db.query(
      'UPDATE nisa.drawings SET drawing_url = $1, original_url = $2, note = $3 WHERE id = $4 RETURNING *',
      [drawing_url, original_url, note, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Drawing update error:', err); // Hataları logla
    res.status(500).json({ error: err.message });
  }
});

// Delete a drawing
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Get current entry to delete images
    const current = await db.query('SELECT * FROM nisa.drawings WHERE id = $1', [id]);
    if (current.rows.length > 0) {
      const entry = current.rows[0];
      // Delete drawing image
      if (entry.drawing_url && entry.drawing_url.startsWith('https://res.cloudinary.com/')) {
        const parts = entry.drawing_url.split('/');
        // 'upload/' kısmından sonraki ve son uzantıdan önceki kısım genellikle public_id'nin başlangıcıdır
        const publicIdWithFolder = parts.slice(parts.indexOf('upload') + 2).join('/').split('.')[0];
        const fullPublicId = `muhabbetisaran/drawings/${publicIdWithFolder}`; // Cloudinary'de belirlediğiniz klasör adı + public_id
        await cloudinary.uploader.destroy(fullPublicId);
        console.log(`Deleted drawing image from Cloudinary: ${fullPublicId}`);
      }
      // Delete original image
      if (entry.original_url && entry.original_url.startsWith('https://res.cloudinary.com/')) {
        const parts = entry.original_url.split('/');
        const publicIdWithFolder = parts.slice(parts.indexOf('upload') + 2).join('/').split('.')[0];
        const fullPublicId = `muhabbetisaran/drawings/${publicIdWithFolder}`;
        await cloudinary.uploader.destroy(fullPublicId);
        console.log(`Deleted original image from Cloudinary: ${fullPublicId}`);
      }
    }
    await db.query('DELETE FROM nisa.drawings WHERE id = $1', [id]);
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('Drawing delete error:', err); // Hataları logla
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
