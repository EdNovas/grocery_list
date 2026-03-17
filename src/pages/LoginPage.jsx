import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    if (password.length < 4) {
      setError('密码至少4个字符');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || (isRegister ? '注册失败' : '登录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__logo">🛒</div>
      <h1 className="login-page__title">智能购物清单</h1>
      <p className="login-page__subtitle">根据购买频率，智能推荐补货商品</p>

      <form className="login-form" onSubmit={handleSubmit}>
        {error && <div className="login-page__error">{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="username">用户名</label>
          <input
            id="username"
            className="form-input"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="输入用户名"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">密码</label>
          <input
            id="password"
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="输入密码"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </div>

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
          {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
        </button>
      </form>

      <div className="login-page__switch">
        {isRegister ? '已有账号？' : '没有账号？'}
        <button onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? '去登录' : '去注册'}
        </button>
      </div>
    </div>
  );
}
