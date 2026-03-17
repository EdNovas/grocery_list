import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { frequencies as freqApi } from '../services/api';
import { PRODUCTS, CATEGORIES } from '../data/products';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, preference, setPreference } = useTheme();
  const [freqCategory, setFreqCategory] = useState('vegetables');
  const [customFreqs, setCustomFreqs] = useState({});
  const [localFreqs, setLocalFreqs] = useState({});
  const [enabledReminders, setEnabledReminders] = useState({});
  const [autoRemind, setAutoRemind] = useState(true);
  const [freqSearch, setFreqSearch] = useState('');
  const [freqSort, setFreqSort] = useState('enabled'); // 'enabled' | 'freq-asc' | 'original'
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState('');
  const saveTimerRef = useRef({});

  useEffect(() => {
    loadFrequencies();
    try {
      const saved = localStorage.getItem('grocery-reminders');
      if (saved) setEnabledReminders(JSON.parse(saved));
    } catch { /* ignore */ }
    // Load reminder days from localStorage (set by checkout dialog)
    try {
      const savedDays = JSON.parse(localStorage.getItem('grocery-reminder-days') || '{}');
      // Merge into localFreqs
      setLocalFreqs(prev => ({ ...prev, ...savedDays }));
    } catch { /* ignore */ }
    setAutoRemind(localStorage.getItem('grocery-auto-remind') !== 'false');
  }, []);

  const loadFrequencies = async () => {
    try {
      const data = await freqApi.get();
      const map = {};
      (data.frequencies || []).forEach(f => {
        map[f.product_id] = f.freq_days;
      });
      setCustomFreqs(map);
      // Merge with localStorage reminder days (checkout dialog sets these)
      try {
        const savedDays = JSON.parse(localStorage.getItem('grocery-reminder-days') || '{}');
        const merged = { ...map };
        Object.entries(savedDays).forEach(([id, days]) => {
          merged[id] = days; // localStorage overrides server for display
        });
        setLocalFreqs(merged);
      } catch {
        setLocalFreqs(map);
      }
    } catch {
      // ignore
    }
  };

  const handleFreqChange = (productId, value) => {
    setLocalFreqs(prev => ({ ...prev, [productId]: value }));
    if (saveTimerRef.current[productId]) clearTimeout(saveTimerRef.current[productId]);

    saveTimerRef.current[productId] = setTimeout(async () => {
      const days = parseInt(value);
      if (isNaN(days) || days < 1) return;
      setSaving(productId);
      try {
        await freqApi.update(productId, days);
        setCustomFreqs(prev => ({ ...prev, [productId]: days }));
        const existingDays = JSON.parse(localStorage.getItem('grocery-reminder-days') || '{}');
        existingDays[productId] = days;
        localStorage.setItem('grocery-reminder-days', JSON.stringify(existingDays));
        showToast('频率已更新 ✓');
      } catch {
        showToast('更新失败');
      }
      setSaving(null);
    }, 800);
  };

  const handleBlur = async (productId) => {
    if (saveTimerRef.current[productId]) clearTimeout(saveTimerRef.current[productId]);
    const value = localFreqs[productId];
    const days = parseInt(value);
    if (isNaN(days) || days < 1) return;

    setSaving(productId);
    try {
      await freqApi.update(productId, days);
      setCustomFreqs(prev => ({ ...prev, [productId]: days }));
      const existingDays = JSON.parse(localStorage.getItem('grocery-reminder-days') || '{}');
      existingDays[productId] = days;
      localStorage.setItem('grocery-reminder-days', JSON.stringify(existingDays));
      showToast('频率已更新 ✓');
    } catch {
      showToast('更新失败');
    }
    setSaving(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1200);
  };

  const toggleReminder = (productId) => {
    setEnabledReminders(prev => {
      const next = { ...prev, [productId]: !prev[productId] };
      localStorage.setItem('grocery-reminders', JSON.stringify(next));
      return next;
    });
  };

  const toggleAutoRemind = () => {
    setAutoRemind(prev => {
      const next = !prev;
      localStorage.setItem('grocery-auto-remind', String(next));
      return next;
    });
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = PRODUCTS.filter(p => p.category === freqCategory);

    // Search filter
    if (freqSearch.trim()) {
      const q = freqSearch.trim().toLowerCase();
      products = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q))
      );
    }

    // Copy to avoid mutating
    products = [...products];

    // Sort
    if (freqSort === 'enabled') {
      // Enabled first, then within enabled: sort by freq ascending
      products.sort((a, b) => {
        const aOn = enabledReminders[a.id] ? 1 : 0;
        const bOn = enabledReminders[b.id] ? 1 : 0;
        if (aOn !== bOn) return bOn - aOn;
        if (aOn && bOn) {
          const aDays = localFreqs[a.id] ?? customFreqs[a.id] ?? a.defaultFreqDays;
          const bDays = localFreqs[b.id] ?? customFreqs[b.id] ?? b.defaultFreqDays;
          return aDays - bDays;
        }
        return 0;
      });
    } else if (freqSort === 'freq-asc') {
      // Sort by frequency days ascending (1 day first)
      products.sort((a, b) => {
        const aDays = localFreqs[a.id] ?? customFreqs[a.id] ?? a.defaultFreqDays;
        const bDays = localFreqs[b.id] ?? customFreqs[b.id] ?? b.defaultFreqDays;
        return aDays - bDays;
      });
    }
    // 'original' — no sort, keep default order

    return products;
  }, [freqCategory, freqSearch, enabledReminders, freqSort, localFreqs, customFreqs]);

  const isSearching = freqSearch.trim().length > 0;

  const getDisplayValue = (product) => {
    if (localFreqs[product.id] !== undefined) return localFreqs[product.id];
    return customFreqs[product.id] || product.defaultFreqDays;
  };

  const themeLabel = preference === 'system'
    ? '🖥️ 跟随系统'
    : preference === 'dark' ? '🌙 深色模式' : '☀️ 浅色模式';

  return (
    <div className="page-enter">
      {/* Theme Toggle */}
      <section className="settings-section">
        <h3 className="settings-section__title">🎨 主题设置</h3>
        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <div className="settings-row" style={{ borderBottom: 'none' }}>
            <span className="settings-row__label">{themeLabel}</span>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              {[
                { val: 'system', icon: '🖥️', label: '自动' },
                { val: 'light', icon: '☀️', label: '浅色' },
                { val: 'dark', icon: '🌙', label: '深色' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setPreference(opt.val)}
                  className={`btn btn--sm ${preference === opt.val ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Info */}
      <section className="settings-section">
        <h3 className="settings-section__title">👤 账号信息</h3>
        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <div className="settings-row" style={{ borderBottom: 'none' }}>
            <span className="settings-row__label">用户名</span>
            <span className="settings-row__value">{user?.username}</span>
          </div>
        </div>
      </section>

      {/* Frequency Settings */}
      <section className="settings-section">
        <h3 className="settings-section__title">⏰ 购买频率提醒</h3>

        {/* Global auto-remind toggle */}
        <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
          <div className="settings-row" style={{ cursor: 'pointer', borderBottom: 'none' }} onClick={toggleAutoRemind}>
            <div>
              <span className="settings-row__label">自动开启提醒</span>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                完成购物后自动为已购商品开启频率提醒
              </p>
            </div>
            <ToggleSwitch on={autoRemind} />
          </div>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-bar__input"
            type="text"
            placeholder="搜索商品频率..."
            value={freqSearch}
            onChange={e => setFreqSearch(e.target.value)}
          />
          {isSearching && (
            <button
              onClick={() => setFreqSearch('')}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-full)',
                width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              }}
            >✕</button>
          )}
        </div>

        {/* Sort options */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
          {[
            { val: 'enabled', label: '✅ 已开启优先' },
            { val: 'freq-asc', label: '📊 频率排序' },
            { val: 'original', label: '📋 原始顺序' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setFreqSort(opt.val)}
              className={`btn btn--sm ${freqSort === opt.val ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category Quick Filter — hidden during search */}
        {!isSearching && (
          <div className="category-tabs" style={{ marginBottom: 'var(--space-md)' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${freqCategory === cat.id ? 'active' : ''}`}
                onClick={() => setFreqCategory(cat.id)}
              >
                <img src={cat.icon} alt="" className="category-tab__icon" /> {cat.name}
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            找到 {filteredProducts.length} 个商品
          </p>
        )}

        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              没有找到商品
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="freq-item">
                <span className="freq-item__emoji">
                  {product.icon
                    ? <img src={product.icon} alt={product.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                    : '🛒'
                  }
                </span>
                <span className="freq-item__name">{product.name}</span>
                <div className="freq-item__controls">
                  <input
                    className="freq-item__input"
                    type="number"
                    min="1"
                    max="365"
                    value={getDisplayValue(product)}
                    onChange={e => handleFreqChange(product.id, e.target.value)}
                    onBlur={() => handleBlur(product.id)}
                    disabled={saving === product.id || !enabledReminders[product.id]}
                    style={{ opacity: enabledReminders[product.id] ? 1 : 0.4 }}
                  />
                  <span className="freq-item__unit">天</span>
                  <div
                    onClick={() => toggleReminder(product.id)}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px',
                      background: enabledReminders[product.id] ? 'var(--color-primary)' : 'var(--text-tertiary)',
                      position: 'relative', cursor: 'pointer', flexShrink: 0,
                      transition: 'background 0.3s ease', marginLeft: 'var(--space-xs)',
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#fff', position: 'absolute', top: '2px',
                      left: enabledReminders[product.id] ? '18px' : '2px',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Logout — at bottom */}
      <section className="settings-section" style={{ marginTop: 'var(--space-xl)' }}>
        <button className="btn btn--danger btn--sm btn--full" onClick={logout}>退出登录</button>
      </section>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}

function ToggleSwitch({ on }) {
  return (
    <div style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: on ? 'var(--color-primary)' : 'var(--text-tertiary)',
      position: 'relative', transition: 'background 0.3s ease', cursor: 'pointer',
      flexShrink: 0,
    }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', position: 'absolute', top: '3px',
        left: on ? '23px' : '3px',
        transition: 'left 0.3s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}
