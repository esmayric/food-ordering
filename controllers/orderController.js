const pool = require('../config/db');

const ALLOWED_PAYMENT_METHODS = ['cash', 'card'];

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const {
    address_id,
    items,
    payment_method = 'cash',
  } = req.body;

  if (!address_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Eksik sipariş verisi.' });
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
    return res.status(400).json({ message: 'Geçersiz ödeme yöntemi.' });
  }

  const normalizedItems = items.map((item) => ({
    food_id: Number(item.food_id),
    quantity: Number(item.quantity),
  }));

  const hasInvalidItem = normalizedItems.some(
    (item) =>
      !Number.isInteger(item.food_id) ||
      item.food_id <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
  );

  if (hasInvalidItem) {
    return res.status(400).json({ message: 'Sipariş ürünleri geçersiz.' });
  }

  let connection;

  try {
    connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    const [addresses] = await connection.query(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
      [address_id, userId]
    );

    if (addresses.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Geçersiz adres.' });
    }

    const foodIds = [...new Set(normalizedItems.map((item) => item.food_id))];
    const placeholders = foodIds.map(() => '?').join(',');

    const [foodPrices] = await connection.query(
      `SELECT id, price FROM foods WHERE id IN (${placeholders})`,
      foodIds
    );

    if (foodPrices.length !== foodIds.length) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Siparişte geçersiz yemek bulunuyor.',
      });
    }

    const priceMap = new Map(
      foodPrices.map((food) => [Number(food.id), Number(food.price)])
    );

    let totalPrice = 0;
    for (const item of normalizedItems) {
      totalPrice += priceMap.get(item.food_id) * item.quantity;
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id,
        address_id,
        total_price,
        payment_method,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, 'Hazırlanıyor', NOW())`,
      [userId, address_id, totalPrice, payment_method]
    );

    const orderId = orderResult.insertId;
    const orderItems = normalizedItems.map((item) => [
      orderId,
      item.food_id,
      item.quantity,
      priceMap.get(item.food_id),
    ]);

    await connection.query(
      `INSERT INTO order_items (
        order_id,
        food_id,
        quantity,
        unit_price
      ) VALUES ?`,
      [orderItems]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Sipariş başarıyla oluşturuldu!',
      order: {
        order_id: orderId,
        address_id,
        payment_method,
        status: 'Hazırlanıyor',
        total_price: Number(totalPrice.toFixed(2)),
        items: normalizedItems,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {
        // Transaction başlamadan hata oluşmuş olabilir.
      }
    }

    console.error('Sipariş oluşturma hatası:', error.message);
    return res.status(500).json({ message: 'Sipariş oluşturulamadı.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getMyOrders = async (req, res) => {
  const userId = req.user.id;
  const db = pool.promise();

  const query = `
    SELECT
      o.id,
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
    JOIN addresses a ON o.address_id = a.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN foods f ON oi.food_id = f.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  try {
    const [results] = await db.query(query, [userId]);
    const groupedOrders = {};

    results.forEach((row) => {
      if (!groupedOrders[row.id]) {
        groupedOrders[row.id] = {
          id: row.id,
          address_text: `${row.address_text}, ${row.city}`,
          total_price: row.total_price,
          payment_method: row.payment_method,
          status: row.status,
          created_at: row.created_at,
          items: [],
        };
      }

      groupedOrders[row.id].items.push({
        food_name: row.food_name,
        price: row.price,
        quantity: row.quantity,
      });
    });

    return res.json(Object.values(groupedOrders));
  } catch (error) {
    console.error('Siparişler alınamadı:', error.message);
    return res.status(500).json({
      message: 'Siparişler alınırken hata oluştu.',
    });
  }
};
