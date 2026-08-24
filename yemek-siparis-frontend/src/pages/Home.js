import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { API_URL, apiFetch } from '../api';

function Home() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const isAdmin = localStorage.getItem('is_admin') === '1';
  const isAuthenticated = localStorage.getItem('token');
  
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('login');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [orderForm, setOrderForm] = useState({
    address: '',
    city: '',
    postal_code: '',
    payment_method: 'cash'
  });

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [categoriesResponse, foodsResponse] = await Promise.all([
          apiFetch('/api/kategoriler'),
          apiFetch('/api/yemekler')
        ]);

        const [categoriesData, foodsData] = await Promise.all([
          categoriesResponse.json(),
          foodsResponse.json()
        ]);

        setCategories(categoriesResponse.ok && Array.isArray(categoriesData) ? categoriesData : []);
        setFoods(foodsResponse.ok && Array.isArray(foodsData) ? foodsData : []);
      } catch (err) {
        console.error('Ana sayfa verileri yüklenemedi:', err);
      }
    };

    loadHomeData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const addToCart = (food) => {
    const existing = cart.find(item => item.id === food.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  const removeFromCart = (foodId) => {
    setCart(cart.filter(item => item.id !== foodId));
  };

  const updateQuantity = (foodId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(foodId);
    } else {
      setCart(cart.map(item => 
        item.id === foodId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleOrder = () => {
    const isAuthenticated = localStorage.getItem('token');
    if (!isAuthenticated) {
      showToast('Sipariş vermek için giriş yapmalısınız!', 'warning');
      setLoginModalMode('login');
      setShowLoginModal(true);
      return;
    }
    setShowOrderModal(true);
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    showToast('Giriş başarılı!', 'success');
    window.location.reload(); // Sayfayı yenile
  };

  const openPolicy = (type) => {
    setPolicyType(type);
    setShowPolicyModal(true);
  };

  const confirmOrder = async () => {
    if (!orderForm.address || !orderForm.city) {
      showToast('Lütfen adres bilgilerini doldurun!', 'error');
      return;
    }

    try {
      // Önce adresi kaydet
      const addressResponse = await apiFetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_text: orderForm.address,
          city: orderForm.city,
          postal_code: orderForm.postal_code
        })
      });

      const addressData = await addressResponse.json();
      
      if (!addressResponse.ok) {
        showToast('Adres kaydedilemedi: ' + addressData.message, 'error');
        return;
      }

      const addressId = addressData.id;

      // Sipariş oluştur
      const orderItems = cart.map(item => ({
        food_id: item.id,
        quantity: item.quantity
      }));

      const orderResponse = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_id: addressId,
          items: orderItems,
          payment_method: orderForm.payment_method
        })
      });

      const orderData = await orderResponse.json();

      if (orderResponse.ok) {
        showToast('Sipariş başarıyla oluşturuldu! Sipariş No: ' + orderData.order.order_id, 'success');
        setCart([]);
        setShowOrderModal(false);
        setOrderForm({ address: '', city: '', postal_code: '', payment_method: 'cash' });
      } else {
        showToast('Sipariş oluşturulamadı: ' + orderData.message, 'error');
      }
    } catch (err) {
      console.error('Sipariş hatası:', err);
      showToast('Sipariş oluşturulurken bir hata oluştu!', 'error');
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesCategory = selectedCategory === 'all' || food.category_id === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/images/logo1.png" alt="Logo" className="header-logo" />
          <h1>Gurmia</h1>
        </div>
        <nav className="nav-menu">
          {isAdmin && <button onClick={() => navigate('/admin')}>Admin Panel</button>}
        </nav>
        <div className="user-info">
          <div className="cart-icon" onClick={() => setShowCartModal(true)}>
            🛒
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </div>
          
          {isAuthenticated ? (
            <>
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
              {isAdmin && <span className="admin-badge">Admin</span>}
            </>
          ) : (
            <div className="auth-buttons">
              <button className="login-btn" onClick={() => { setLoginModalMode('login'); setShowLoginModal(true); }}>Giriş Yap</button>
              <button className="register-btn" onClick={() => { setLoginModalMode('register'); setShowLoginModal(true); }}>Kayıt Ol</button>
            </div>
          )}
        </div>
      </header>
      
      <div className="main-layout">
        <aside className="sidebar">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="ARA" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <h3 className="sidebar-title">ÜRÜNLER</h3>
          
          <nav className="category-menu">
            <div 
              className={selectedCategory === 'all' ? 'category-item active' : 'category-item'}
              onClick={() => setSelectedCategory('all')}
            >
              • Tüm Ürünler
            </div>
            {categories.map(cat => (
              <div
                key={cat.id}
                className={selectedCategory === cat.id ? 'category-item active' : 'category-item'}
                onClick={() => setSelectedCategory(cat.id)}
              >
                • {cat.name}
              </div>
            ))}
          </nav>
        </aside>

       <main className="home-content">

  <div className="home-banner">
    <img
      src="/images/ana.jpeg"
      alt="Gurmia"
      className="home-banner-image"
    />
  </div>

  <div className="home-products-row">

    <div className="foods-grid">
      {filteredFoods.length > 0 ? (
        filteredFoods.map(food => (
          <div key={food.id} className="food-card">
            <div className="food-image">
              {food.image_url ? (
                <img
                  src={`${API_URL}${food.image_url}`}
                  alt={food.name}
                  onError={(e) =>
                    e.target.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="80">🍽️</text></svg>'
                  }
                />
              ) : (
                <span className="food-emoji">🍽️</span>
              )}
            </div>

            <h3>{food.name}</h3>
            <p>{food.description}</p>

            <div className="food-footer">
              <span className="price">{food.price} ₺</span>
              <button onClick={() => addToCart(food)}>
                Sepete Ekle
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="no-results">Ürün bulunamadı</p>
      )}
    </div>

    {cart.length > 0 && (
      <div className="cart-summary">
        <h3>Sepet ({cart.length})</h3>

        <div className="cart-summary-items">
          {cart.map(item => (
            <div key={item.id} className="cart-summary-item">
              <span className="item-name">
                {item.name} x{item.quantity}
              </span>

              <span className="item-price">
                {(item.price * item.quantity).toFixed(2)} ₺
              </span>
            </div>
          ))}
        </div>

        <div className="cart-divider"></div>

        <div className="cart-total">
          <span>Toplam:</span>
          <strong>{totalPrice.toFixed(2)} ₺</strong>
        </div>

        <button
          className="order-btn"
          onClick={handleOrder}
        >
          Sipariş Ver
        </button>
      </div>
    )}

  </div>

</main>
      </div>

      {/* Sepet Modalı */}
      {showCartModal && (
        <div className="modal-overlay" onClick={() => setShowCartModal(false)}>
          <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-modal-header">
              <h2>Tüm Sepetler</h2>
              <button className="close-btn" onClick={() => setShowCartModal(false)}>✕</button>
            </div>
            
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🍽️</div>
                <p>Sepetiniz boş</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  <h3 className="cart-section-title">Ürünleriniz</h3>
                  {cart.map(item => (
                    <div key={item.id} className="cart-modal-item">
                      <img 
                        src={item.image_url ? `${API_URL}${item.image_url}` : ''} 
                        alt={item.name}
                        className="cart-item-image"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p className="cart-item-desc">{item.description}</p>
                      </div>
                      <div className="cart-item-actions">
                        <div className="item-price-large">{(item.price * item.quantity).toFixed(2)} TL</div>
                        <div className="quantity-controls-inline">
                          <button className="qty-btn-inline" onClick={() => removeFromCart(item.id)}>🗑️</button>
                          <span className="qty-number-inline">{item.quantity}</span>
                          <div className="qty-buttons">
                            <button className="qty-btn-small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                            <button className="qty-btn-small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-modal-footer">
                  <div className="cart-summary-section">
                    <h4>Sepetine bunları da ekle</h4>
                    <p className="suggestion-text">Önerilen ürünler...</p>
                  </div>
                  
                  <div className="cart-total-section">
                    <div className="total-row">
                      <span>Toplam</span>
                      <span className="total-amount">{totalPrice.toFixed(2)} TL</span>
                    </div>
                    <button className="checkout-btn-large" onClick={() => {
                      setShowCartModal(false);
                      handleOrder();
                    }}>
                      Sepeti Onayla
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sipariş Modalı */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sipariş Özeti</h2>
            
            <div className="order-items">
              {cart.map(item => (
                <div key={item.id} className="order-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                </div>
              ))}
            </div>
            
            <div className="order-total">
              <strong>Toplam: {totalPrice.toFixed(2)} ₺</strong>
            </div>

            <div className="address-form">
              <h3>Teslimat Adresi</h3>
              <input
                type="text"
                placeholder="Adres"
                value={orderForm.address}
                onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Şehir"
                value={orderForm.city}
                onChange={(e) => setOrderForm({...orderForm, city: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Posta Kodu (Opsiyonel)"
                value={orderForm.postal_code}
                onChange={(e) => setOrderForm({...orderForm, postal_code: e.target.value})}
              />
            </div>
            
            <div className="payment-methods">
              <h3>Ödeme Yöntemi</h3>
              <label>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cash"
                  checked={orderForm.payment_method === 'cash'}
                  onChange={(e) => setOrderForm({...orderForm, payment_method: e.target.value})}
                />
                Kapıda Nakit Ödeme
              </label>
              <label>
                <input 
                  type="radio" 
                  name="payment" 
                  value="card"
                  checked={orderForm.payment_method === 'card'}
                  onChange={(e) => setOrderForm({...orderForm, payment_method: e.target.value})}
                />
                Kapıda Kredi Kartı
              </label>
            </div>

            <p className="payment-note">Bu demo uygulamada ödeme işlemi simüle edilir; kart bilgisi alınmaz veya saklanmaz.</p>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowOrderModal(false)}>İptal</button>
              <button className="confirm-btn" onClick={confirmOrder}>Siparişi Onayla</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Ödeme Yöntemleri</h4>
            <p>💳 Kapıda Kredi Kartı</p>
            <p>💵 Kapıda Nakit</p>
          </div>
          <div className="footer-section">
            <h4>Kurumsal</h4>
            <p><button type="button" className="policy-link" onClick={() => openPolicy('aydinlatma')}>Aydınlatma Metni</button></p>
            <p><button type="button" className="policy-link" onClick={() => openPolicy('kullanici')}>Kullanıcı Sözleşmesi</button></p>
            <p><button type="button" className="policy-link" onClick={() => openPolicy('gizlilik')}>Gizlilik Politikası</button></p>
          </div>
          <div className="footer-section">
            <h4>İletişim</h4>
            <p>📞 0850 123 45 67</p>
            <p>📧 info@yemeksiparis.com</p>
            <p>📍 İstanbul, Türkiye</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Yemek Sipariş Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.type === 'warning' && '⚠ '}
          {toast.message}
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          initialMode={loginModalMode}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <PolicyModal type={policyType} onClose={() => setShowPolicyModal(false)} />
      )}
    </div>
  );
}

// Login Modal Component
function LoginModal({ onClose, onSuccess, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    surname: '',
    phone: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin 
      ? '/api/users/login'
      : '/api/users/register';

    const body = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('name', data.name);
          localStorage.setItem('is_admin', data.is_admin || '0');
          onSuccess();
        } else {
          alert('Kayıt başarılı! Giriş yapabilirsiniz.');
          setIsLogin(true);
          setFormData({ email: '', password: '', name: '', surname: '', phone: '' });
        }
      } else {
        setError(data.message || 'Bir hata oluştu');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Sunucuya bağlanılamadı. Backend çalışıyor mu?');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        <div className="login-icon">🍴</div>
        <h2>{isLogin ? 'Tekrar Hoş Geldin' : 'Hesap Oluştur'}</h2>
        <p className="login-subtitle">
          {isLogin ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Ad</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Adınız"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Soyad</label>
                <input
                  type="text"
                  name="surname"
                  placeholder="Soyadınız"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="05XX XXX XX XX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="kullanici@ornek.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              name="password"
              placeholder="şifre"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="submit-btn">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>
        
        <p className="toggle-text">
          {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? ' Kayıt Ol' : ' Giriş Yap'}
          </span>
        </p>
      </div>
    </div>
  );
}

// Policy Modal Component
function PolicyModal({ type, onClose }) {
  const getPolicyContent = () => {
    switch (type) {
      case 'aydinlatma':
        return {
          title: 'Demo Veri Bilgilendirmesi',
          content: `
            <h3>Portföy/Demo Uygulaması</h3>
            <p>Gurmia, eğitim ve portföy amacıyla geliştirilmiş bir demo uygulamasıdır. Gerçek bir ticari yemek sipariş hizmeti sunmaz.</p>
            <h4>Uygulamada kullanılan veriler</h4>
            <ul>
              <li>Hesap bilgileri: ad, soyad, e-posta ve telefon</li>
              <li>Teslimat bilgileri: adres, şehir ve isteğe bağlı posta kodu</li>
              <li>Sipariş bilgileri: seçilen ürünler, adetler, sipariş anındaki fiyatlar ve ödeme tercihi</li>
            </ul>
            <p>Şifreler veritabanında düz metin olarak tutulmaz; bcrypt ile hashlenir. Kart numarası veya CVV gibi kart bilgileri uygulama tarafından alınmaz ya da saklanmaz.</p>
          `,
        };
      case 'kullanici':
        return {
          title: 'Demo Kullanım Notu',
          content: `
            <h3>Demo Kullanım Notu</h3>
            <p>Bu proje yalnızca yazılım geliştirme becerilerini göstermek için hazırlanmıştır.</p>
            <ul>
              <li>Sipariş oluşturma akışı simülasyondur.</li>
              <li>Gerçek ödeme, teslimat, iade veya para transferi yapılmaz.</li>
              <li>Admin panelindeki sipariş durumları demo amaçlıdır.</li>
              <li>Ürün ve fiyat verileri örnek veridir.</li>
            </ul>
          `,
        };
      case 'gizlilik':
        return {
          title: 'Demo Gizlilik Notu',
          content: `
            <h3>Demo Gizlilik Notu</h3>
            <p>Uygulama, temel hesap ve sipariş fonksiyonlarını göstermek için gerekli verileri kullanır.</p>
            <ul>
              <li>Kimlik doğrulama JWT ile yapılır.</li>
              <li>JWT tarayıcı localStorage alanında tutulur.</li>
              <li>Şifreler bcrypt ile hashlenir.</li>
              <li>Uygulamada kart numarası veya CVV formu bulunmaz.</li>
              <li>Projede analiz/izleme amaçlı özel bir çerez sistemi uygulanmamıştır.</li>
            </ul>
            <p>Gerçek bir üretim ortamında HttpOnly cookie, HTTPS, rate limiting ve kapsamlı veri koruma süreçleri ayrıca uygulanmalıdır.</p>
          `,
        };
      default:
        return { title: '', content: '' };
    }
  };

  const policy = getPolicyContent();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="policy-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h2>{policy.title}</h2>
        <div className="policy-content" dangerouslySetInnerHTML={{ __html: policy.content }} />
      </div>
    </div>
  );
}

export default Home;
