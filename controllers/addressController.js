const pool = require('../config/db');

const db = pool.promise();

exports.createAddress = async (req, res) => {
  const { address_text, city, postal_code } = req.body;
  const userId = req.user.id;

  if (!address_text || !city) {
    return res.status(400).json({ message: 'Adres ve şehir bilgisi gereklidir.' });
  }

  const normalizedAddress = address_text.trim();
  const normalizedCity = city.trim();
  const normalizedPostalCode = postal_code?.trim() || null;

  try {
    const [existingAddresses] = await db.query(
      `SELECT id
       FROM addresses
       WHERE user_id = ?
         AND address_text = ?
         AND city = ?
         AND COALESCE(postal_code, '') = COALESCE(?, '')
       LIMIT 1`,
      [userId, normalizedAddress, normalizedCity, normalizedPostalCode]
    );

    if (existingAddresses.length > 0) {
      return res.status(200).json({
        message: 'Kayıtlı adres kullanıldı.',
        id: existingAddresses[0].id,
        reused: true,
      });
    }

    const [result] = await db.query(
      'INSERT INTO addresses (user_id, address_text, city, postal_code) VALUES (?, ?, ?, ?)',
      [userId, normalizedAddress, normalizedCity, normalizedPostalCode]
    );

    return res.status(201).json({
      message: 'Adres kaydedildi!',
      id: result.insertId,
      reused: false,
    });
  } catch (error) {
    console.error('Adres ekleme hatası:', error.message);
    return res.status(500).json({ message: 'Adres eklenemedi.' });
  }
};
