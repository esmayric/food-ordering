import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import { API_URL, apiFetch } from '../api';

function Admin() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const isAdmin = localStorage.getItem('is_admin') === '1';

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [foods, setFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [editedPrices, setEditedPrices] = useState({});
  const [updatingFoodId, setUpdatingFoodId] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  });

  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/kategoriler');
      const data = await response.json();
      setCategories(response.ok && Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
      setCategories([]);
    }
  }, []);

  const fetchFoods = useCallback(async () => {
    try {
      setFoodsLoading(true);
      const response = await apiFetch('/api/yemekler');
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setFoods(data);
        setEditedPrices(
          Object.fromEntries(data.map((food) => [food.id, String(food.price)]))
        );
      } else {
        console.error('Yemek verisi beklenen formatta değil:', data);
        setFoods([]);
        setEditedPrices({});
      }
    } catch (err) {
      console.error('Yemekler yüklenemedi:', err);
      setFoods([]);
      setEditedPrices({});
    } finally {
      setFoodsLoading(false);
    }
  }, []);

  const fetchAllOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const response = await apiFetch('/api/admin/orders');
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        console.error('Admin yetkilendirme hatası:', data);
        setOrders([]);
        navigate('/');
        return;
      }

      if (response.ok && Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('Admin sipariş hatası:', data);
        setOrders([]);
      }
    } catch (err) {
      console.error('Siparişler yüklenemedi:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchAllOrders();
    fetchCategories();
    fetchFoods();
  }, [isAdmin, navigate, fetchAllOrders, fetchCategories, fetchFoods]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (response.ok) {
        showToast('Sipariş durumu güncellendi!', 'success');
        fetchAllOrders();
      } else {
        showToast(data.message || 'Durum güncellenemedi!', 'error');
      }
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      showToast('Bir hata oluştu!', 'error');
    }
  };

  const updateFoodPrice = async (foodId) => {
    const newPrice = Number(editedPrices[foodId]);

    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      showToast('Geçerli bir fiyat gir!', 'error');
      return;
    }

    try {
      setUpdatingFoodId(foodId);
      const response = await apiFetch(`/api/yemekler/${foodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });
      const data = await response.json();

      if (response.ok) {
        setFoods((currentFoods) =>
          currentFoods.map((food) =>
            food.id === foodId ? { ...food, price: newPrice } : food
          )
        );
        setEditedPrices((current) => ({
          ...current,
          [foodId]: newPrice.toFixed(2),
        }));
        showToast('Fiyat güncellendi!', 'success');
      } else {
        showToast(data.message || 'Fiyat güncellenemedi!', 'error');
      }
    } catch (err) {
      console.error('Fiyat güncelleme hatası:', err);
      showToast('Bir hata oluştu!', 'error');
    } finally {
      setUpdatingFoodId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const addFood = async (e) => {
    e.preventDefault();
    let imageUrl = foodForm.image_url;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      try {
        const uploadResponse = await apiFetch('/api/yemekler/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          showToast(uploadData.message || 'Görsel yüklenemedi!', 'error');
          setUploading(false);
          return;
        }

        imageUrl = uploadData.imageUrl;
      } catch (err) {
        console.error('Görsel yükleme hatası:', err);
        showToast('Görsel yüklenirken hata oluştu!', 'error');
        setUploading(false);
        return;
      }
    }

    try {
      const response = await apiFetch('/api/yemekler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...foodForm, image_url: imageUrl }),
      });
      const data = await response.json();

      if (response.ok) {
        showToast('Yemek başarıyla eklendi!', 'success');
        setFoodForm({
          name: '',
          description: '',
          price: '',
          category_id: '',
          image_url: '',
        });
        setSelectedFile(null);
        await fetchFoods();
      } else {
        showToast(data.message || 'Yemek eklenemedi!', 'error');
      }
    } catch (err) {
      console.error('Yemek ekleme hatası:', err);
      showToast('Bir hata oluştu!', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const getStatusColor = (status) => {
    switch (status) {
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
    <div className="admin-container">
      <header className="admin-header">
        <div
          className="header-left"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <img src="/images/logo1.png" alt="Logo" className="header-logo" />
          <h1>Admin Paneli</h1>
        </div>

        <nav className="nav-menu">
          <button onClick={() => navigate('/')}>Ana Sayfa</button>
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
                <div className="dropdown-item" onClick={() => navigate('/orders')}>
                  📦 Geçmiş Siparişlerim
                </div>
                <div className="dropdown-item" onClick={handleLogout}>
                  🚪 Çıkış Yap
                </div>
              </div>
            )}
          </div>
          <span className="admin-badge">Admin</span>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={activeTab === 'orders' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('orders')}
        >
          📦 Siparişler
        </button>
        <button
          className={activeTab === 'manageFoods' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('manageFoods')}
        >
          🛠️ Yemekleri Yönet
        </button>
        <button
          className={activeTab === 'addFood' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('addFood')}
        >
          🍽️ Yemek Ekle
        </button>
      </div>

      <main className="admin-content">
        {activeTab === 'orders' && (
          <>
            <h2>📊 Tüm Siparişler</h2>
            {ordersLoading ? (
              <p className="loading">Yükleniyor...</p>
            ) : orders.length === 0 ? (
              <p className="no-orders">Henüz sipariş yok.</p>
            ) : (
              <div className="admin-orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="admin-order-card">
                    <div className="order-header">
                      <div>
                        <h3>Sipariş #{order.id}</h3>
                        <p className="order-user">👤 {order.user_name} {order.user_surname}</p>
                        <p className="order-date">
                          📅 {new Date(order.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="status-controls">
                        <span
                          className="order-status"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="Hazırlanıyor">Hazırlanıyor</option>
                          <option value="Yolda">Yolda</option>
                          <option value="Teslim Edildi">Teslim Edildi</option>
                          <option value="İptal">İptal</option>
                        </select>
                      </div>
                    </div>

                    <div className="order-items">
                      {Array.isArray(order.items) && order.items.map((item, idx) => (
                        <div key={idx} className="order-item">
                          <span>{item.food_name} x{item.quantity}</span>
                          <span>{(Number(item.price) * Number(item.quantity)).toFixed(2)} ₺</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-meta">
                      <span>💳 {getPaymentLabel(order.payment_method)}</span>
                    </div>
                    <div className="order-footer">
                      <div className="order-address">📍 {order.address_text}</div>
                      <div className="order-total">
                        <strong>Toplam: {Number(order.total_price).toFixed(2)} ₺</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'manageFoods' && (
          <>
            <div className="manage-foods-heading">
              <div>
                <h2>🛠️ Yemekleri Yönet</h2>
                <p>Güncel fiyatı buradan değiştir. Eski siparişlerde sipariş anındaki fiyat korunur.</p>
              </div>
              <button type="button" className="refresh-foods-btn" onClick={fetchFoods}>
                Yenile
              </button>
            </div>

            {foodsLoading ? (
              <p className="loading">Yemekler yükleniyor...</p>
            ) : foods.length === 0 ? (
              <p className="no-orders">Henüz yemek yok.</p>
            ) : (
              <div className="food-management-grid">
                {foods.map((food) => (
                  <div key={food.id} className="food-management-card">
                    <div className="food-management-image">
                      {food.image_url ? (
                        <img src={`${API_URL}${food.image_url}`} alt={food.name} />
                      ) : (
                        <span>🍽️</span>
                      )}
                    </div>
                    <div className="food-management-info">
                      <h3>{food.name}</h3>
                      <p>{food.description || 'Açıklama yok'}</p>
                      <small>Güncel fiyat: {Number(food.price).toFixed(2)} ₺</small>
                    </div>
                    <div className="price-edit-row">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editedPrices[food.id] ?? ''}
                        onChange={(e) =>
                          setEditedPrices((current) => ({
                            ...current,
                            [food.id]: e.target.value,
                          }))
                        }
                        aria-label={`${food.name} yeni fiyat`}
                      />
                      <button
                        type="button"
                        onClick={() => updateFoodPrice(food.id)}
                        disabled={updatingFoodId === food.id}
                      >
                        {updatingFoodId === food.id ? 'Kaydediliyor...' : 'Fiyatı Güncelle'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'addFood' && (
          <>
            <h2>🍽️ Yeni Yemek Ekle</h2>
            <form className="food-form" onSubmit={addFood}>
              <div className="form-row">
                <div className="form-group">
                  <label>Yemek Adı</label>
                  <input
                    type="text"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fiyat (₺)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kategori</label>
                  <select
                    value={foodForm.category_id}
                    onChange={(e) => setFoodForm({ ...foodForm, category_id: e.target.value })}
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Görsel Yükle</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  {selectedFile && (
                    <p className="file-name">Seçilen: {selectedFile.name}</p>
                  )}
                </div>
              </div>

              <button type="submit" className="submit-food-btn" disabled={uploading}>
                {uploading ? 'Yükleniyor...' : 'Yemek Ekle'}
              </button>
            </form>
          </>
        )}
      </main>

      {toast.show && createPortal(
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.message}
        </div>,
        document.body
      )}
    </div>
  );
}

export default Admin;
