const express = require('express');
const db = require('../db/database');

const router = express.Router();

// GET /api/employees  — list all, optional ?department= filter
router.get('/', (req, res) => {
  const { department } = req.query;
  let rows;
  if (department) {
    const stmt = db.prepare(
      'SELECT * FROM employees WHERE LOWER(department) = LOWER(?) ORDER BY name'
    );
    rows = stmt.all(department);
  } else {
    rows = db.prepare('SELECT * FROM employees ORDER BY name').all();
  }
  res.json(rows);
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Employee not found' });
  res.json(row);
});

// POST /api/employees
router.post('/', (req, res) => {
  const { name, email, department, role, hire_date } = req.body;
  if (!name || !email || !department || !role || !hire_date) {
    return res.status(400).json({ error: 'All fields are required: name, email, department, role, hire_date' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  try {
    const stmt = db.prepare(
      'INSERT INTO employees (name, email, department, role, hire_date) VALUES (?, ?, ?, ?, ?)'
    );
    const info = stmt.run(name.trim(), email.trim(), department.trim(), role.trim(), hire_date);
    const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }
    throw err;
  }
});

// PUT /api/employees/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Employee not found' });

  const { name, email, department, role, hire_date } = req.body;
  if (!name || !email || !department || !role || !hire_date) {
    return res.status(400).json({ error: 'All fields are required: name, email, department, role, hire_date' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  try {
    db.prepare(
      'UPDATE employees SET name = ?, email = ?, department = ?, role = ?, hire_date = ? WHERE id = ?'
    ).run(name.trim(), email.trim(), department.trim(), role.trim(), hire_date, req.params.id);
    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }
    throw err;
  }
});

// DELETE /api/employees/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Employee not found' });
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
