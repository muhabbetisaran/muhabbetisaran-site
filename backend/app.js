require('dotenv').config();
const db = require('./db');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Log to confirm server start
console.log('Starting app.js...');

// Serve static files from frontend/public
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));
// Serve uploaded files
app.use('/public/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/backgrounds', express.static(path.join(__dirname, 'backgrounds')));

// API routes
console.log('Before requiring crushesRouter');
const crushesRouter = require('./routes/crushes');
app.use('/api/crushes', crushesRouter);
console.log('After requiring crushesRouter');

const showsRouter = require('./routes/shows');
app.use('/api/shows', showsRouter);

const sisterFunRouter = require('./routes/sister_fun');
app.use('/api/sister-fun', sisterFunRouter);

const pinterestRouter = require('./routes/pinterest');
app.use('/api/pinterest', pinterestRouter);

const drawingsRouter = require('./routes/drawings');
app.use('/api/drawings', drawingsRouter);

const motivationRouter = require('./routes/motivation');
app.use('/api/motivation', motivationRouter);

// Serve the main HTML file (homepage)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/index.html'));
});

// Serve the K-pop crushes section page
app.get('/crushes', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/crushes.html'));
});

app.get('/shows', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/shows.html'));
});

// Serve the Sister Fun Calendar page
app.get('/sister-fun', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/sister_fun.html'));
});

app.get('/pinterest', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/pinterest.html'));
});

app.get('/drawings', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/drawings.html'));
});

app.get('/motivation', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/views/motivation.html'));
});

// Debug route: lists all tables
app.get('/api/debug-tables', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test route: fetches data from crushes
app.get('/api/test', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM crushes LIMIT 1');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backgrounds', (req, res) => {
  const dir = path.join(__dirname, 'backgrounds');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read backgrounds folder' });
    // Only return image files
    const images = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));
    res.json(images);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});