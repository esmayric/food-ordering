import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { apiFetch } from '../api';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    surname: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
          navigate('/');
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
    <div className="login-container">
      <div className="login-box">
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

export default Login;
