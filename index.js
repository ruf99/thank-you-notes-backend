const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database('./database.db');

app.use(cors());
app.use(express.json());

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      upvotes INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY
    )
  `);
});

// Submit entry
app.post('/api/submit', (req, res) => {
  const { text } = req.body;

  // Validate the input
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Insert into the database
  db.run('INSERT INTO entries (text) VALUES (?)', [text], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to submit entry' });
    }
    res.json({ success: true }); // Return JSON response
  });
});

// Get entries
app.get('/api/entries', (req, res) => {
  db.all('SELECT * FROM entries', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch entries' });
    }
    res.json(rows); // Return JSON response
  });
});

// Upvote entry
app.post('/api/upvote/:id', (req, res) => {
  const { id } = req.params;

  // Validate the input
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  // Update the upvote count
  db.run('UPDATE entries SET upvotes = upvotes + 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to upvote entry' });
    }
    res.json({ success: true }); // Return JSON response
  });
});

// Check if user has visited
app.post('/api/check-user', (req, res) => {
  const { userId } = req.body;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).send(err);
    if (row) return res.json({ visited: true });
    res.json({ visited: false });
  });
});

// Record user visit
app.post('/api/record-user', (req, res) => {
  const { userId } = req.body;

  // Validate the input
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Check if the user already exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Insert into the database
    db.run('INSERT INTO users (id) VALUES (?)', [userId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to record user' });
      }
      res.json({ success: true }); // Return JSON response
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));