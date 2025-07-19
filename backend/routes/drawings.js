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

// List all drawings
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM drawings ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new drawing (with images)
router.post('/', upload.fields([
  { name: 'drawing', maxCount: 1 },
  { name: 'original', maxCount: 1 }
]), async (req, res) => {
  const { note } = req.body;
  const drawing_url = req.files['drawing'] ? `/public/uploads/${req.files['drawing'][0].filename}` : null;
  const original_url = req.files['original'] ? `/public/uploads/${req.files['original'][0].filename}` : null;
  try {
    const result = await db.query(
      'INSERT INTO drawings (drawing_url, original_url, note) VALUES ($1, $2, $3) RETURNING *',
      [drawing_url, original_url, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single drawing
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM drawings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
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

  // Get current entry
  const current = await db.query('SELECT * FROM drawings WHERE id = $1', [id]);
  if (current.rows.length === 0) return res.status(404).json({ error: 'Not found' });

  drawing_url = req.files['drawing'] ? `/public/uploads/${req.files['drawing'][0].filename}` : current.rows[0].drawing_url;
  original_url = req.files['original'] ? `/public/uploads/${req.files['original'][0].filename}` : current.rows[0].original_url;

  try {
    const result = await db.query(
      'UPDATE drawings SET drawing_url = $1, original_url = $2, note = $3 WHERE id = $4 RETURNING *',
      [drawing_url, original_url, note, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a drawing
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Get current entry to delete images
    const current = await db.query('SELECT * FROM drawings WHERE id = $1', [id]);
    if (current.rows.length > 0) {
      const entry = current.rows[0];
      // Delete drawing image
      if (entry.drawing_url && entry.drawing_url.startsWith('/public/uploads/')) {
        const filePath = path.join(__dirname, '..', entry.drawing_url.replace('/public/', ''));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      // Delete original image
      if (entry.original_url && entry.original_url.startsWith('/public/uploads/')) {
        const filePath = path.join(__dirname, '..', entry.original_url.replace('/public/', ''));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    await db.query('DELETE FROM drawings WHERE id = $1', [id]);
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
