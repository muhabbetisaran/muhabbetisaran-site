const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all entries for a month
router.get('/', async (req, res) => {
  const { month } = req.query; // month format: YYYY-MM
  try {
    const result = await db.query(
      'SELECT * FROM sister_fun WHERE to_char(date, $1) = $2 ORDER BY date',
      ['YYYY-MM', month]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get entry for a specific date
router.get('/:date', async (req, res) => {
  const date = req.params.date; // format: YYYY-MM-DD
  try {
    const result = await db.query('SELECT * FROM sister_fun WHERE date = $1', [date]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No entry for this date' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update entry for a date
router.post('/', async (req, res) => {
  const { date, description, rating } = req.body;
  try {
    // Check if entry exists
    const check = await db.query('SELECT * FROM sister_fun WHERE date = $1', [date]);
    let result;
    if (check.rows.length > 0) {
      // Update
      result = await db.query(
        'UPDATE sister_fun SET description = $1, rating = $2 WHERE date = $3 RETURNING *',
        [description, rating, date]
      );
    } else {
      // Insert
      result = await db.query(
        'INSERT INTO sister_fun (date, description, rating) VALUES ($1, $2, $3) RETURNING *',
        [date, description, rating]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit entry by id
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { description, rating } = req.body;
  try {
    const result = await db.query(
      'UPDATE sister_fun SET description = $1, rating = $2 WHERE id = $3 RETURNING *',
      [description, rating, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete entry by id
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM sister_fun WHERE id = $1', [id]);
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 