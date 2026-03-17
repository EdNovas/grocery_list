import { useState, useEffect } from 'react';
import { admin as adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Redirect non-admin
  useEffect(() => {
    if (user && !user.isAdmin) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, [tab]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const data = await adminApi.getOverview();
        setStats(data.stats);
      } else if (tab === 'users') {
        const data = await adminApi.getUsers();
        setUsers(data.users || []);
      } else if (tab === 'products') {
        const data = await adminApi.getProducts();
        setProducts(data.products || []);
      }
    } catch (err) {
      showToast('加载失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`确定删除商品 "${name}"？这会同时删除所有相关数据。`)) return;
    try {
      await adminApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('已删除');
    } catch { showToast('删除失败'); }
  };

  const handleToggleAdmin = async (userId, username) => {
    if (!confirm(`确定切换 ${username} 的管理员权限？`)) return;
    try {
      await adminApi.toggleAdmin(userId);
      loadData();
      showToast('已更新');
    } catch (err) { showToast(err.message || '操作失败'); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`⚠️ 确定永久删除用户 "${username}" 及其所有数据？此操作不可恢复！`)) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('已删除用户');
    } catch (err) { showToast(err.message || '删除失败'); }
  };

  if (!user?.isAdmin) return null;

  const tabs = [
    { key: 'overview', label: '📊 概览' },
    { key: 'users', label: '👥 用户' },
    { key: 'products', label: '📦 自定义商品' },
  ];

  return (
    <div className="page-enter">
      <div className="admin-header">
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>🔧 管理后台</h2>
      </div>

      {/* Tab Bar */}
      <div className="admin-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`admin-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* Overview Tab */}
          {tab === 'overview' && stats && (
            <div className="admin-stats-grid">
              <div className="glass-card admin-stat-card">
                <div className="admin-stat-card__icon">👥</div>
                <div className="admin-stat-card__value">{stats.users}</div>
                <div className="admin-stat-card__label">注册用户</div>
              </div>
              <div className="glass-card admin-stat-card">
                <div className="admin-stat-card__icon">🏪</div>
                <div className="admin-stat-card__value">{stats.systemProducts}</div>
                <div className="admin-stat-card__label">系统商品</div>
              </div>
              <div className="glass-card admin-stat-card">
                <div className="admin-stat-card__icon">✨</div>
                <div className="admin-stat-card__value">{stats.customProducts}</div>
                <div className="admin-stat-card__label">自定义商品</div>
              </div>
              <div className="glass-card admin-stat-card">
                <div className="admin-stat-card__icon">🛒</div>
                <div className="admin-stat-card__value">{stats.purchaseRecords}</div>
                <div className="admin-stat-card__label">购买记录</div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户名</th>
                    <th>角色</th>
                    <th>自定义商品</th>
                    <th>购物清单</th>
                    <th>购买记录</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.username}</strong></td>
                      <td>
                        <span className={`admin-badge ${u.is_admin ? 'admin-badge--admin' : 'admin-badge--user'}`}>
                          {u.is_admin ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td>{u.custom_product_count}</td>
                      <td>{u.list_count}</td>
                      <td>{u.history_count}</td>
                      <td className="admin-table__date">{u.created_at?.split('T')[0] || '-'}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="btn btn--ghost btn--sm" onClick={() => handleToggleAdmin(u.id, u.username)}
                            title={u.is_admin ? '取消管理员' : '设为管理员'}>
                            {u.is_admin ? '👤' : '⭐'}
                          </button>
                          {u.id !== user.id && (
                            <button className="btn btn--danger btn--sm" onClick={() => handleDeleteUser(u.id, u.username)}
                              title="删除用户">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Products Tab */}
          {tab === 'products' && (
            <div className="admin-table-container">
              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">📦</div>
                  <p className="empty-state__title">暂无自定义商品</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>图标</th>
                      <th>名称</th>
                      <th>分类</th>
                      <th>创建者</th>
                      <th>频率(天)</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td style={{ fontSize: '1.4em' }}>{p.emoji}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td>{p.creator_name || '-'}</td>
                        <td>{p.default_freq_days}</td>
                        <td>
                          <button className="btn btn--danger btn--sm" onClick={() => handleDeleteProduct(p.id, p.name)}>
                            🗑️ 删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </div>
  );
}
