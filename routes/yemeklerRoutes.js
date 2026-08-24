const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const imagesDirectory = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(imagesDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|gif|webp/;
    const validExtension = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const validMimeType = allowedExtensions.test(file.mimetype);

    if (validMimeType && validExtension) {
      return cb(null, true);
    }

    return cb(new Error('Sadece JPEG, PNG, GIF veya WEBP görseller yüklenebilir.'));
  },
});

// Tüm yemekleri getir (public)
router.get('/', (req, res) => {
  db.query('SELECT * FROM foods ORDER BY id ASC', (err, results) => {
    if (err) {
      console.error('Yemekler alınamadı:', err.message);
      return res.status(500).json({ message: 'Yemekler alınırken bir hata oluştu.' });
    }

    return res.json(results);
  });
});

// Görsel yükleme (sadece admin)
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Görsel yüklenemedi.' });
      }
      return next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi.' });
    }

    return res.json({ imageUrl: `/images/${req.file.filename}` });
  }
);

// Yeni yemek ekle (sadece admin)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, category_id, image_url } = req.body;
  const numericPrice = Number(price);
  const categoryId = Number(category_id);

  if (!name || !Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'Yemek adı ve geçerli bir fiyat gereklidir.' });
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ message: 'Geçerli bir kategori seçilmelidir.' });
  }

  const sql = 'INSERT INTO foods (name, description, price, category_id, image_url) VALUES (?, ?, ?, ?, ?)';

  db.query(
    sql,
    [name.trim(), description?.trim() || null, numericPrice, categoryId, image_url || null],
    (err, result) => {
      if (err) {
        console.error('Yemek eklenemedi:', err.message);
        return res.status(500).json({ message: 'Yemek eklenirken bir hata oluştu.' });
      }

      return res.status(201).json({ message: 'Yemek başarıyla eklendi!', id: result.insertId });
    }
  );
});

// Yemek fiyatını güncelle (sadece admin)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const foodId = Number(req.params.id);
  const numericPrice = Number(req.body.price);

  if (!Number.isInteger(foodId) || foodId <= 0) {
    return res.status(400).json({ message: 'Geçersiz yemek ID.' });
  }

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'Geçerli bir fiyat giriniz.' });
  }

  db.query(
    'UPDATE foods SET price = ? WHERE id = ?',
    [numericPrice, foodId],
    (err, result) => {
      if (err) {
        console.error('Yemek fiyatı güncellenemedi:', err.message);
        return res.status(500).json({ message: 'Fiyat güncellenirken hata oluştu.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Yemek bulunamadı.' });
      }

      return res.json({
        message: 'Fiyat başarıyla güncellendi!',
        food_id: foodId,
        price: numericPrice,
      });
    }
  );
});

module.exports = router;
