// routes/credit.routes.js
const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const authMiddleware = require('../middlewares/auth.middleware');

// Endpoint READ tidak dilindungi token (public)
router.get('/read', creditController.read);

// Endpoint lain (create, update, delete) tetap dilindungi JWT
router.post('/create', authMiddleware, creditController.create);
router.put('/update/:id', authMiddleware, creditController.update);
router.delete('/delete/:id', authMiddleware, creditController.delete);

module.exports = router;
