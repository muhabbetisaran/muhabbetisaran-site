const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all shows
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM shows ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new show
router.post('/', async (req, res) => {
  const { title, type, description, best_line, youtube_link, instagram_link } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO shows (title, type, description, best_line, youtube_link, instagram_link) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, type, description, best_line, youtube_link, instagram_link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single show
router.get('/:id', async (req, res) => {
  const showId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM shows WHERE id = $1', [showId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a show
router.put('/:id', async (req, res) => {
  const showId = req.params.id;
  const { title, type, description, best_line, youtube_link, instagram_link } = req.body;
  try {
    const result = await db.query(
      'UPDATE shows SET title = $1, type = $2, description = $3, best_line = $4, youtube_link = $5, instagram_link = $6 WHERE id = $7 RETURNING *',
      [title, type, description, best_line, youtube_link, instagram_link, showId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a show
router.delete('/:id', async (req, res) => {
  const showId = req.params.id;
  try {
    await db.query('DELETE FROM shows WHERE id = $1', [showId]);
    res.json({ message: 'Show deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 