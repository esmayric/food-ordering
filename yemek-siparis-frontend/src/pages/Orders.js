import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Orders.css';
import { apiFetch } from '../api';

function Orders() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const isAdmin = localStorage.getItem('is_admin') === '1';
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiFetch('/api/orders/my');
        const data = await response.json();
        setOrders(response.ok && Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Siparişler yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Hazırlanıyor': return '#f39c12';
      case 'Yolda': return '#3498db';
      case 'Teslim Edildi': return '#27ae60';
      case 'İptal': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getPaymentLabel = (method) =>
    method === 'card' ? 'Kapıda Kredi Kartı' : 'Kapıda Nakit';

  return (
    <div className="orders-container">
      <header className="orders-header">
        <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/images/logo1.png" alt="Logo" className="header-logo" />
          <h1>Gurmia</h1>
        </div>
        <nav className="nav-menu">
          {isAdmin && <button onClick={() => navigate('/admin')}>Admin Panel</button>}
        </nav>
        <div className="user-info">
          <div className="user-dropdown">
            <div className="user-name" onClick={() => setShowUserMenu(!showUserMenu)}>
              <span>👤 {name}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showUserMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => navigate('/account')}>
                  👤 Hesabım
                </div>
                <div className="dropdown-item active">
                  📦 Geçmiş Siparişlerim
                </div>
                <div className="dropdown-item" onClick={handleLogout}>
                  🚪 Çıkış Yap
                </div>
              </div>
            )}
          </div>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      </header>

      <main className="orders-content">
        <h2>📦 Siparişlerim</h2>
        
        {loading ? (
          <p className="loading">Yükleniyor...</p>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p>Henüz siparişiniz bulunmuyor.</p>
            <button onClick={() => navigate('/')}>Sipariş Ver</button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Sipariş #{order.id}</h3>
                    <p className="order-date">
                      {new Date(order.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span 
                    className="order-status" 
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </div>
                
                <div className="order-items">
                  {Array.isArray(order.items) && order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <span>{item.food_name} x{item.quantity}</span>
                      <span>{(Number(item.price) * Number(item.quantity)).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
                
                <div className="order-footer">
                  <div>
                    <div className="order-address">
                      📍 {order.address_text || 'Adres bilgisi yok'}
                    </div>
                    <div className="order-payment">
                      💳 {getPaymentLabel(order.payment_method)}
                    </div>
                  </div>
                  <div className="order-total">
                    <strong>Toplam: {Number(order.total_price).toFixed(2)} ₺</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;
