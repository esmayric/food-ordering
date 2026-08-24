const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const userRoutes = require('./routes/userRoutes');
const yemeklerRoutes = require('./routes/yemeklerRoutes');
const kategorilerRoutes = require('./routes/kategorilerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const addressRoutes = require('./routes/addressRoutes');

app.use('/api/users', userRoutes);
app.use('/api/kullanicilar', userRoutes);
app.use('/api/yemekler', yemeklerRoutes);
app.use('/api/kategoriler', kategorilerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);

app.get('/', (req, res) => {
  res.send('🍕 Yemek Sipariş Sistemi API çalışıyor!');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint bulunamadı.' });
});

app.use((err, req, res, next) => {
  console.error('Beklenmeyen sunucu hatası:', err);
  res.status(500).json({ message: 'Beklenmeyen bir sunucu hatası oluştu.' });
});

app.listen(env.port, () => {
  console.log(`🚀 Sunucu ${env.port} portunda çalışıyor`);
});
