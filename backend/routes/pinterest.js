const express = require('express');
const router = express.Router();
const db = require('../db');
const fetch = require('node-fetch');

// Get all pinterest entries
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM nisa.pinterest ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new pinterest entry
router.post('/', async (req, res) => {
  const { link, note } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO nisa.pinterest (link, note) VALUES ($1, $2) RETURNING *',
      [link, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy for Pinterest oEmbed preview (MUST be before /:id)
router.get('/preview', async (req, res) => {
  const { url } = req.query;
  try {
    const oembedRes = await fetch(`https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const text = await oembedRes.text();
    console.log('Pinterest oEmbed status:', oembedRes.status, 'body:', text);
    if (!oembedRes.ok) return res.status(400).json({ error: 'No preview' });
    const data = JSON.parse(text);
    res.json({ thumbnail_url: data.thumbnail_url });
  } catch (err) {
    console.error('Pinterest oEmbed error:', err);
    res.status(500).json({ error: 'No preview' });
  }
});

// Get a single pinterest entry
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM nisa.pinterest WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a pinterest entry
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { link, note } = req.body;
  try {
    const result = await db.query(
      'UPDATE nisa.pinterest SET link = $1, note = $2 WHERE id = $3 RETURNING *',
      [link, note, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a pinterest entry
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM nisa.pinterest WHERE id = $1', [id]);
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
