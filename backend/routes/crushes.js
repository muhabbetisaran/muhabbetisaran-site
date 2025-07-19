console.log("crushesRouter loaded");
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ... existing crushes routes ...
console.log("crushesRouter after multer");

// Get all crushes
router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM crushes ORDER BY id DESC');
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
        'INSERT INTO crushes (name, description, instagram_link, youtube_link) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, instagram_link, youtube_link]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Upload a photo for a crush
router.post('/:id/photos', upload.single('photo'), async (req, res) => {
  const crushId = req.params.id;
  const photoUrl = `/public/uploads/${req.file.filename}`;
  try {
    await db.query(
      'INSERT INTO crush_photos (crush_id, photo_url) VALUES ($1, $2)',
      [crushId, photoUrl]
    );
    res.status(201).json({ photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log("crushesRouter after photo upload");
// Get all photos for a crush
router.get('/:id/photos', async (req, res) => {
  const crushId = req.params.id;
  try {
    const result = await db.query(
      'SELECT * FROM crush_photos WHERE crush_id = $1',
      [crushId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log("crushesRouter after photo get");


// Get a single crush
router.get('/:id', async (req, res) => {
  const crushId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM crushes WHERE id = $1', [crushId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crush not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update a crush
router.put('/:id', async (req, res) => {
  const crushId = req.params.id;
  const { name, description, instagram_link, youtube_link } = req.body;
  try {
    const result = await db.query(
      'UPDATE crushes SET name = $1, description = $2, instagram_link = $3, youtube_link = $4 WHERE id = $5 RETURNING *',
      [name, description, instagram_link, youtube_link, crushId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Delete a crush and its photos
router.delete('/:id', async (req, res) => {
  const crushId = req.params.id;
  try {
    // Delete associated photos first (if you want to remove files from disk, add code here)
    await db.query('DELETE FROM crush_photos WHERE crush_id = $1', [crushId]);
    // Delete the crush
    await db.query('DELETE FROM crushes WHERE id = $1', [crushId]);
    res.json({ message: 'Crush and associated photos deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
console.log("crushesRouter after module export");