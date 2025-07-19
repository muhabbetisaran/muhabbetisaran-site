const express = require('express');
const router = express.Router();
const db = require('../db');

// List all motivation texts
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM motivation ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new motivation text
router.post('/', async (req, res) => {
  const { text } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO motivation (text) VALUES ($1) RETURNING *',
      [text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single motivation text
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM motivation WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a motivation text
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { text } = req.body;
  try {
    const result = await db.query(
      'UPDATE motivation SET text = $1 WHERE id = $2 RETURNING *',
      [text, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a motivation text
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM motivation WHERE id = $1', [id]);
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;