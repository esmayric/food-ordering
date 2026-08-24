const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const ALLOWED_STATUSES = [
  'Hazırlanıyor',
  'Yolda',
  'Teslim Edildi',
  'İptal'
];

router.use(authenticateToken, requireAdmin);

// Tüm siparişleri listele (admin)
router.get('/orders', (req, res) => {
  const sql = `
    SELECT
      o.id,
      o.user_id,
      u.name AS user_name,
      u.surname AS user_surname,
      o.total_price,
      o.payment_method,
      o.status,
      o.created_at,
      a.address_text,
      a.city,
      f.name AS food_name,
      oi.unit_price AS price,
      oi.quantity
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN addresses a ON o.address_id = a.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN foods f ON oi.food_id = f.id
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Admin siparişler alınamadı:', err.message);

      return res.status(500).json({
        message: 'Siparişler alınırken hata oluştu.'
      });
    }

    const groupedOrders = {};

    results.forEach((row) => {
      if (!groupedOrders[row.id]) {
        groupedOrders[row.id] = {
          id: row.id,
          user_id: row.user_id,
          user_name: row.user_name,
          user_surname: row.user_surname,
          address_text: `${row.address_text}, ${row.city}`,
          total_price: row.total_price,
          payment_method: row.payment_method,
          status: row.status,
          created_at: row.created_at,
          items: []
        };
      }

      groupedOrders[row.id].items.push({
        food_name: row.food_name,
        price: row.price,
        quantity: row.quantity
      });
    });

    return res.json(Object.values(groupedOrders));
  });
});

// Sipariş durumu güncelle (admin)
router.put('/orders/:orderId/status', (req, res) => {
  const orderId = Number(req.params.orderId);
  const { status } = req.body;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: 'Geçersiz sipariş ID.'
    });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      message: 'Geçersiz sipariş durumu.'
    });
  }

  db.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId],
    (err, result) => {
      if (err) {
        console.error(
          'Sipariş durumu güncellenemedi:',
          err.message
        );

        return res.status(500).json({
          message: 'Güncelleme başarısız.'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: 'Sipariş bulunamadı.'
        });
      }

      return res.json({
        message: 'Durum güncellendi.',
        orderId,
        status
      });
    }
  );
});

module.exports = router;