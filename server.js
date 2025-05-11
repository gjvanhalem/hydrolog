const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS plant_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      position TEXT,
      status TEXT,
      photoUrl TEXT,
      notes TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      waterRefill INTEGER,
      pH REAL,
      EC REAL,
      TDS REAL,
      temperature REAL,
      notes TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )`);
  }
});

// Routes
app.get('/api/plant-logs', (req, res) => {
  db.all('SELECT * FROM plant_logs', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/plant-logs', (req, res) => {
  const { date, position, status, photoUrl, notes } = req.body;
  db.run(
    'INSERT INTO plant_logs (date, position, status, photoUrl, notes) VALUES (?, ?, ?, ?, ?)',
    [date, position, status, photoUrl, notes],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID, ...req.body });
      }
    }
  );
});

app.get('/api/system-logs', (req, res) => {
  db.all('SELECT * FROM system_logs', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/system-logs', (req, res) => {
  const { date, waterRefill, pH, EC, TDS, temperature, notes } = req.body;
  db.run(
    'INSERT INTO system_logs (date, waterRefill, pH, EC, TDS, temperature, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [date, waterRefill ? 1 : 0, pH, EC, TDS, temperature, notes],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id: this.lastID, ...req.body });
      }
    }
  );
});

// Fetch all statuses
app.get('/api/statuses', (req, res) => {
  db.all('SELECT * FROM statuses', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new status
app.post('/api/statuses', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO statuses (name) VALUES (?)', [name], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID, name });
    }
  });
});

// Delete a status
app.delete('/api/statuses/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM statuses WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json({ message: 'Status deleted successfully' });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
