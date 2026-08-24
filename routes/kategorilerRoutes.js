const express = require('express');
const router = express.Router();
const db = require('../config/db');


router.get('/', (req, res) => {
  const sql = 'SELECT * FROM categories';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ kategori alınamadı:', err.message);
      return res.status(500).json({ message: 'kategoriler alınırken bir hata oluştu' });
    }

    res.json(results);
  });
});

module.exports = router;