const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const employeesRouter = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 3001;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

app.use('/api/employees', employeesRouter);

// Global error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
