console.log("crushesRouter loaded");
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
//const path = require('path');
//const fs = require('fs');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up multer for file uploads
//const uploadDir = path.join(__dirname, '../uploads');
//if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ... existing crushes routes ...
console.log("crushesRouter after multer");

// Get all crushes
router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM nisa.crushes ORDER BY id DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Add a new crush
  router.post('/', async (req, res) => {
    const { name, description, instagram_link, youtube_link } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO nisa.crushes (name, description, instagram_link, youtube_link) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, instagram_link, youtube_link]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error adding new crush:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

// Upload a photo for a crush
router.post('/:id/photos', upload.single('photo'), async (req, res) => {
  const crushId = req.params.id;

  if (!req.file) { // Dosya yüklenmediyse kontrol et
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'muhabbetisaran/crush_photos' // Cloudinary'de belirlediğiniz klasör
    });

    const photoUrl = cloudinaryResponse.secure_url; // Cloudinary'den gelen güvenli URL
    
    await db.query(
      'INSERT INTO nisa.crush_photos (crush_id, photo_url) VALUES ($1, $2)',
      [crushId, photoUrl]
    );
    res.status(201).json({ photoUrl });
  } catch (err) {
    console.error('Error uploading photo to Cloudinary or saving to DB:', err); // Detaylı hata loglama
    res.status(500).json({ error: err.message });
  }
});
console.log("crushesRouter after photo upload");
// Get all photos for a crush
router.get('/:id/photos', async (req, res) => {
  const crushId = req.params.id;
  try {
    const result = await db.query(
      'SELECT * FROM nisa.crush_photos WHERE crush_id = $1',
      [crushId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching crush photos:', err.message); // Hata loglama ekledik
    res.status(500).json({ error: err.message });
  }
});
console.log("crushesRouter after photo get");


// Get a single crush
router.get('/:id', async (req, res) => {
  const crushId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM nisa.crushes WHERE id = $1', [crushId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crush not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching single crush:', err.message); // Hata loglama ekledik
    res.status(500).json({ error: err.message });
  }
});
// Update a crush
router.put('/:id', async (req, res) => {
  const crushId = req.params.id;
  const { name, description, instagram_link, youtube_link } = req.body;
  try {
    const result = await db.query(
      'UPDATE nisa.crushes SET name = $1, description = $2, instagram_link = $3, youtube_link = $4 WHERE id = $5 RETURNING *',
      [name, description, instagram_link, youtube_link, crushId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating crush:', err.message); // Hata loglama ekledik
    res.status(500).json({ error: err.message });
  }
});



// Delete a crush and its photos
router.delete('/:id', async (req, res) => {
  const crushId = req.params.id;
  try {
    const photosToDelete = await db.query('SELECT photo_url FROM nisa.crush_photos WHERE crush_id = $1', [crushId]);

    for (const photo of photosToDelete.rows) {
      // Cloudinary URL'sinden public_id'yi çıkarın
      // Örnek URL: https://res.cloudinary.com/cloud_name/image/upload/v123456789/folder/public_id.jpg
      const publicIdMatch = photo.photo_url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
      if (publicIdMatch && publicIdMatch[1]) {
        const publicId = publicIdMatch[1];
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Cloudinary photo ${publicId} deleted.`);
        } catch (cloudinaryErr) {
          console.error(`Error deleting photo ${publicId} from Cloudinary:`, cloudinaryErr);
        }
      }
    }
    // Delete associated photos first (if you want to remove files from disk, add code here)
    await db.query('DELETE FROM nisa.crush_photos WHERE crush_id = $1', [crushId]);
    // Delete the crush
    await db.query('DELETE FROM nisa.crushes WHERE id = $1', [crushId]);
    res.json({ message: 'Crush and associated photos deleted.' });
  } catch (err) {
    console.error('Error deleting crush or photos:', err.message); // Hata loglama ekledik
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
console.log("crushesRouter after module export");