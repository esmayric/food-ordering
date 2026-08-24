import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Account.css';
import { apiFetch } from '../api';

function Account() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('is_admin') === '1';
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    surname: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiFetch('/api/kullanicilar/me');
        const data = await response.json();

        if (response.ok) {
          setUserInfo({
            name: data.name || '',
            surname: data.surname || '',
            email: data.email || '',
            phone: data.phone || ''
          });
        } else {
          setToast({ show: true, message: data.message || 'Profil bilgileri yüklenemedi!', type: 'error' });
        }
      } catch (error) {
        setToast({ show: true, message: 'Profil bilgileri yüklenemedi!', type: 'error' });
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiFetch('/api/kullanicilar/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('name', userInfo.name);
        showToast('Profil bilgileri güncellendi!', 'success');
      } else {
        showToast(data.message || 'Profil güncellenemedi!', 'error');
      }
    } catch (error) {
      showToast('Bir hata oluştu!', 'error');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('Yeni şifreler eşleşmiyor!', 'error');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showToast('Şifre en az 6 karakter olmalıdır!', 'error');
      return;
    }

    try {
      const response = await apiFetch('/api/kullanicilar/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Şifre başarıyla değiştirildi!', 'success');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        showToast(data.message || 'Şifre değiştirilemedi!', 'error');
      }
    } catch (error) {
      showToast('Bir hata oluştu!', 'error');
    }
  };

  return (
    <div className="account-container">
      <header className="account-header">
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
              <span>👤 {userInfo.name}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showUserMenu && (
              <div className="dropdown-menu">
                <div className="dropdown-item active">
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
        </div>
      </header>

      <div className="account-tabs">
        <button 
          className={activeTab === 'profile' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profil Bilgileri
        </button>
        <button 
          className={activeTab === 'password' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('password')}
        >
          🔒 Şifre Değiştir
        </button>
      </div>

      <main className="account-content">
        {activeTab === 'profile' ? (
          <div className="profile-section">
            <h2>Profil Bilgileri</h2>
            <form onSubmit={updateProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Ad</label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Soyad</label>
                  <input
                    type="text"
                    value={userInfo.surname}
                    onChange={(e) => setUserInfo({...userInfo, surname: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>E-posta</label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="save-btn">Değişiklikleri Kaydet</button>
            </form>
          </div>
        ) : (
          <div className="password-section">
            <h2>Şifre Değiştir</h2>
            <form onSubmit={changePassword} className="password-form">
              <div className="form-group">
                <label>Mevcut Şifre</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Yeni Şifre</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label>Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  minLength="6"
                  required
                />
              </div>

              <button type="submit" className="save-btn">Şifreyi Değiştir</button>
            </form>
          </div>
        )}
      </main>

      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✕ '}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Account;
