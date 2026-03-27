import { useState } from 'react';
import { useShoppingList } from '../hooks/useShoppingList';
import { PRODUCTS } from '../data/products';

const productMap = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const getIcon = (item) => {
  const prod = productMap[item.product_id || item.id];
  if (prod?.icon) return <img src={prod.icon} alt={item.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />;
  return item.emoji || '🛒';
};

export default function ShoppingListPage() {
  const {
    items, loading, toggleItem, removeItem,
    updateQuantity, completeAll, clearCompleted, checkout
  } = useShoppingList();
  const [toast, setToast] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { type: 'full' | 'partial', count: number }

  const pending = items.filter(i => !i.completed);
  const completed = items.filter(i => i.completed);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  };

  const executeCheckout = async (completedOnly) => {
    setCheckingOut(true);
    setConfirmDialog(null);
    const ok = await checkout(completedOnly);
    if (ok) {
      showToast(completedOnly
        ? `🎉 已保存 ${completed.length} 件已购商品！`
        : '🎉 购买记录已保存！'
      );
    }
    setCheckingOut(false);
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <p className="empty-state__title">清单是空的</p>
          <p className="empty-state__desc">去首页或分类页添加商品吧</p>
        </div>
      ) : (
        <>
          {/* Action Bar */}
          <div className="action-bar">
            <button className="btn btn--primary btn--sm" onClick={completeAll}>
              ✅ 全部完成
            </button>
            {completed.length > 0 && (
              <button className="btn btn--danger btn--sm" onClick={clearCompleted}>
                🗑️ 清除已完成
              </button>
            )}
          </div>

          {/* Pending Items */}
          {pending.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="section-header">
                <h2 className="section-title">待购买</h2>
                <span className="section-subtitle">{pending.length} 件</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pending.map(item => (
                  <div key={item.id} className="list-item">
                    <button className="list-item__checkbox" onClick={() => toggleItem(item.id)} />
                    <span className="list-item__emoji">{getIcon(item)}</span>
                    <div className="list-item__info">
                      <div className="list-item__name">{item.name}</div>
                    </div>
                    <div className="list-item__actions">
                      <div className="list-item__quantity">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="list-item__remove" onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Items */}
          {completed.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="section-header">
                <h2 className="section-title" style={{ opacity: 0.6 }}>已完成</h2>
                <span className="section-subtitle">{completed.length} 件</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {completed.map(item => (
                  <div key={item.id} className="list-item completed">
                    <button className="list-item__checkbox" onClick={() => toggleItem(item.id)}>✓</button>
                    <span className="list-item__emoji">{getIcon(item)}</span>
                    <div className="list-item__info">
                      <div className="list-item__name">{item.name}</div>
                    </div>
                    <div className="list-item__actions">
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>×{item.quantity}</span>
                      <button className="list-item__remove" onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Checkout */}
          {items.length > 0 && (
            <div className="glass-card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
              <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                共 {items.length} 件商品{completed.length > 0 && `，已勾选 ${completed.length} 件`}
              </p>
              {completed.length > 0 && completed.length < items.length && (
                <button
                  className="btn btn--primary btn--full"
                  onClick={() => setConfirmDialog({ type: 'partial', count: completed.length })}
                  disabled={checkingOut}
                  style={{ marginBottom: 'var(--space-sm)' }}
                >
                  {checkingOut ? '处理中...' : `✅ 保存已勾选 (${completed.length} 件)`}
                </button>
              )}
              <button
                className={`btn btn--full ${completed.length > 0 && completed.length < items.length ? 'btn--ghost' : 'btn--primary'}`}
                onClick={() => setConfirmDialog({ type: 'full', count: items.length })}
                disabled={checkingOut}
              >
                {checkingOut ? '处理中...' : '📋 全部保存到历史'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-content__handle" />
            <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
                {confirmDialog.type === 'partial' ? '🛒' : '📋'}
              </div>
              <h3 style={{ marginBottom: 'var(--space-sm)', fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
                {confirmDialog.type === 'partial' ? '确认保存已勾选？' : '确认保存全部？'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)', lineHeight: 1.5 }}>
                {confirmDialog.type === 'partial'
                  ? <>将 <strong>{confirmDialog.count}</strong> 件已勾选商品保存到历史记录，<br/>未勾选的 <strong>{pending.length}</strong> 件将保留在清单中</>
                  : <>将清单中全部 <strong>{confirmDialog.count}</strong> 件商品保存到历史记录，<br/>清单将会清空</>
                }
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  className="btn btn--ghost btn--full"
                  onClick={() => setConfirmDialog(null)}
                >
                  取消
                </button>
                <button
                  className="btn btn--primary btn--full"
                  onClick={() => executeCheckout(confirmDialog.type === 'partial')}
                >
                  确认保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
