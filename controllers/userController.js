const connection = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const db = connection.promise();

// Kullanıcı Kaydı
exports.register = async (req, res) => {
  const { name, surname, email, phone, password } = req.body;

  if (!name || !surname || !email || !phone || !password) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurunuz.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Bu email zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (name, surname, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), surname.trim(), normalizedEmail, phone.trim(), hashedPassword]
    );

    return res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (error) {
    console.error('Kullanıcı kayıt hatası:', error.message);
    return res.status(500).json({ message: 'Kullanıcı kaydedilemedi.' });
  }
};

// Kullanıcı Girişi
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email ve şifre gereklidir.' });
  }

  try {
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Email veya şifre hatalı.' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Email veya şifre hatalı.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: Number(user.is_admin) || 0 },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return res.json({
      message: 'Giriş başarılı!',
      token,
      name: user.name,
      surname: user.surname,
      is_admin: Number(user.is_admin) || 0,
    });
  } catch (error) {
    console.error('Giriş hatası:', error.message);
    return res.status(500).json({ message: 'Giriş işlemi tamamlanamadı.' });
  }
};

// Giriş yapan kullanıcının bilgilerini getir
exports.getProfile = async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, name, surname, email, phone FROM users WHERE id = ?',
      [req.user.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    return res.json(results[0]);
  } catch (error) {
    console.error('Profil getirme hatası:', error.message);
    return res.status(500).json({ message: 'Profil bilgileri alınamadı.' });
  }
};

// Giriş yapan kullanıcının profilini güncelle
exports.updateProfile = async (req, res) => {
  const { name, surname, email, phone } = req.body;

  if (!name || !surname || !email || !phone) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurunuz.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [normalizedEmail, req.user.id]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Bu e-posta adresi başka bir hesap tarafından kullanılıyor.' });
    }

    const [result] = await db.query(
      'UPDATE users SET name = ?, surname = ?, email = ?, phone = ? WHERE id = ?',
      [name.trim(), surname.trim(), normalizedEmail, phone.trim(), req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    return res.json({ message: 'Profil başarıyla güncellendi!' });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error.message);
    return res.status(500).json({ message: 'Profil güncellenemedi.' });
  }
};

// Giriş yapan kullanıcının şifresini değiştir
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurunuz.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır.' });
  }

  try {
    const [results] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(current_password, results[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    return res.json({ message: 'Şifre başarıyla değiştirildi!' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error.message);
    return res.status(500).json({ message: 'Şifre güncellenemedi.' });
  }
};
