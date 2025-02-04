// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


const creditRoutes = require('./routes/credit.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const { LOGIN_USERNAME, LOGIN_PASSWORD } = process.env;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Folder untuk file static (HTML, CSS, JS client)
app.use(express.static(path.join(__dirname, 'public')));

// Routing untuk API Credit (semua endpoint CRUD)
app.use('/api/credit', creditRoutes);

// Endpoint untuk login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
      // Generate token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Username atau password salah' });
    }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
