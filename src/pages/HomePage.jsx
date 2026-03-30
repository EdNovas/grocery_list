import { useState, useMemo, useCallback } from 'react';
import { useShoppingList } from '../hooks/useShoppingList';
import { PRODUCTS } from '../data/products';
import { useNavigate } from 'react-router-dom';
import { frequencies as freqApi } from '../services/api';
import { useConfirm } from '../components/Dialogs';

const productMap = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const getIcon = (item) => {
  const prod = productMap[item.product_id || item.id];
  if (prod?.icon) return <img src={prod.icon} alt={item.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />;
  return item.emoji || '🛒';
};

function getRandomPicks(categories) {
  const picks = [];
  categories.forEach(({ cat, sub, count }) => {
    let pool = PRODUCTS.filter(p => p.category === cat);
    if (sub) pool = pool.filter(p => sub.includes(p.subCategory));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    picks.push(...shuffled.slice(0, count));
  });
  return picks;
}

function getLongCyclePicks() {
  const longCycleIds = [
    902, 900, 901, 920, 921, 922, 966, 967,
    954, 955, 910, 911, 912, 924, 950, 951,
    952, 953, 965, 958, 959, 960,
  ];
  const shuffled = [...longCycleIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8).map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
}

function ProductCard({ product, isInList, onAdd, subtitle }) {
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    if (!isInList) {
      onAdd(product.id);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 400);
    }
  };

  return (
    <div
      className={`product-card ${isInList ? 'in-list' : ''} ${justAdded ? 'just-added' : ''}`}
      onClick={handleClick}
    >
      <span className="product-card__emoji">
        <img src={product.icon} alt={product.name} loading="lazy" />
      </span>
      <span className="product-card__name">{product.name}</span>
      {subtitle && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{subtitle}</span>}
      <span className="product-card__add-icon">{isInList ? '✓' : '+'}</span>
    </div>
  );
}

function RefreshButton({ onClick }) {
  const [spinning, setSpinning] = useState(false);
  const handleClick = (e) => {
    e.stopPropagation();
    setSpinning(true);
    onClick();
    setTimeout(() => setSpinning(false), 500);
  };
  return (
    <button className="refresh-btn" onClick={handleClick} title="换一批">
      <span className={`refresh-btn__icon ${spinning ? 'spinning' : ''}`}>↻</span>
    </button>
  );
}

// Checkout dialog for setting new product reminders
function CheckoutDialog({ newProducts, onClose, onSave }) {
  const [reminders, setReminders] = useState(
    Object.fromEntries(newProducts.map(p => [p.id, { enabled: true, days: p.defaultFreqDays }]))
  );

  const toggleAll = (val) => {
    setReminders(prev => {
      const next = {};
      for (const id in prev) next[id] = { ...prev[id], enabled: val };
      return next;
    });
  };

  const updateDays = (id, days) => {
    setReminders(prev => ({ ...prev, [id]: { ...prev[id], days: parseInt(days) || 7 } }));
  };

  const toggleOne = (id) => {
    setReminders(prev => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflow: 'auto' }}>
        <div className="modal-content__handle" />
        <h3 style={{ marginBottom: 'var(--space-sm)', fontWeight: 700 }}>🔔 设置购买频率提醒</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          以下是您首次购买的商品，是否要为它们开启周期提醒？
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <button className="btn btn--primary btn--sm" onClick={() => toggleAll(true)} style={{ flex: 1 }}>
            全部开启
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => toggleAll(false)} style={{ flex: 1 }}>
            全部关闭
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {newProducts.map(p => (
            <div key={p.id} className="freq-dialog-item">
              <span className="freq-dialog-item__icon">
                {p.icon ? <img src={p.icon} alt={p.name} style={{ width: 24, height: 24, objectFit: 'contain' }} /> : '🛒'}
              </span>
              <span className="freq-dialog-item__name">{p.name}</span>
              <input
                type="number"
                className="freq-item__input"
                min="1"
                max="365"
                value={reminders[p.id]?.days || p.defaultFreqDays}
                onChange={e => updateDays(p.id, e.target.value)}
                disabled={!reminders[p.id]?.enabled}
                style={{ opacity: reminders[p.id]?.enabled ? 1 : 0.4, width: '52px' }}
              />
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginRight: 'var(--space-sm)' }}>天</span>
              <div
                onClick={() => toggleOne(p.id)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px',
                  background: reminders[p.id]?.enabled ? 'var(--color-primary)' : 'var(--text-tertiary)',
                  position: 'relative', cursor: 'pointer', flexShrink: 0,
                  transition: 'background 0.3s ease',
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: '2px',
                  left: reminders[p.id]?.enabled ? '18px' : '2px',
                  transition: 'left 0.3s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
          <button className="btn btn--ghost btn--full" onClick={onClose}>跳过</button>
          <button className="btn btn--primary btn--full" onClick={() => onSave(reminders)}>保存设置</button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const {
    items, loading, toggleItem, removeItem,
    updateQuantity, updateNote, completeAll, clearCompleted, checkout,
    addItem, isInList, clearAll
  } = useShoppingList();
  const [toast, setToast] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [dailyKey, setDailyKey] = useState(0);
  const [longKey, setLongKey] = useState(0);
  const [checkoutDialog, setCheckoutDialog] = useState(null);
  const [homeSearch, setHomeSearch] = useState('');
  const navigate = useNavigate();
  const [confirmNode, confirm] = useConfirm();

  const pending = items.filter(i => !i.completed);
  const completed = items.filter(i => i.completed);
  const hasItems = items.length > 0;

  const dailyCategories = [
    { cat: 'vegetables', sub: ['叶菜类', '茄果类', '根茎类', '菌菇类'], count: 6 },
    { cat: 'meat', sub: ['猪肉', '禽肉', '牛肉'], count: 3 },
    { cat: 'seafood', sub: null, count: 2 },
    { cat: 'dairy', sub: ['蛋类', '牛奶'], count: 2 },
    { cat: 'fruits', sub: null, count: 3 },
  ];

  const dailyPicks = useMemo(() => getRandomPicks(dailyCategories), [dailyKey]);
  const longCyclePicks = useMemo(() => getLongCyclePicks(), [longKey]);

  // Get reminder items that are DUE (past 70% of their cycle)
  const reminderItems = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('grocery-reminders') || '{}');
      const savedDays = JSON.parse(localStorage.getItem('grocery-reminder-days') || '{}');
      const purchaseDates = JSON.parse(localStorage.getItem('grocery-purchase-dates') || '{}');
      const now = Date.now();

      return Object.entries(saved)
        .filter(([, enabled]) => enabled)
        .map(([idStr]) => {
          const id = parseInt(idStr);
          const product = productMap[id];
          if (!product) return null;

          const freqDays = savedDays[id] || product.defaultFreqDays;
          const lastPurchase = purchaseDates[id];

          // If we have a purchase date, check if we're past 70% of the cycle
          if (lastPurchase) {
            const elapsedMs = now - lastPurchase;
            const cycleMsThreshold = freqDays * 24 * 60 * 60 * 1000 * 0.7; // 70% of cycle
            if (elapsedMs < cycleMsThreshold) {
              return null; // Not due yet
            }
          }
          // If no purchase date recorded, don't show (just enabled, not due)
          if (!lastPurchase) return null;

          const daysSincePurchase = lastPurchase ? Math.floor((now - lastPurchase) / (1000 * 60 * 60 * 24)) : null;
          const dueLabel = daysSincePurchase !== null
            ? (daysSincePurchase >= freqDays ? '已到期' : `还剩${freqDays - daysSincePurchase}天`)
            : null;

          return { ...product, reminderDays: freqDays, dueLabel };
        })
        .filter(Boolean)
        .sort((a, b) => {
          // Items that are overdue first
          const aOverdue = a.dueLabel === '已到期' ? 0 : 1;
          const bOverdue = b.dueLabel === '已到期' ? 0 : 1;
          return aOverdue - bOverdue;
        })
        .slice(0, 12);
    } catch { return []; }
  }, [items]); // re-check when items change

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  };

  const handleCheckout = async (completedOnly = false) => {
    setCheckingOut(true);
    try {
      // Track which products are being purchased
      const purchasedItems = completedOnly ? completed : items;
      const purchasedProductIds = purchasedItems.map(i => i.product_id);

      // Check which are "new" (never had reminders set)
      const existing = JSON.parse(localStorage.getItem('grocery-reminders') || '{}');
      const newProductIds = purchasedProductIds.filter(id => existing[id] === undefined);

      const ok = await checkout(completedOnly);
      if (ok) {
        showToast(completedOnly
          ? `🎉 已保存 ${purchasedItems.length} 件已购商品！`
          : '🎉 购买记录已保存！'
        );

        // Record purchase dates for ALL purchased products (for reminder timing)
        const purchaseDates = JSON.parse(localStorage.getItem('grocery-purchase-dates') || '{}');
        const now = Date.now();
        purchasedProductIds.forEach(id => {
          purchaseDates[id] = now;
        });
        localStorage.setItem('grocery-purchase-dates', JSON.stringify(purchaseDates));

        // Auto-enable reminders ONLY for already-known products (not new ones)
        const autoRemind = localStorage.getItem('grocery-auto-remind') !== 'false';
        if (autoRemind) {
          const updated = { ...existing };
          purchasedProductIds.forEach(id => {
            // Only auto-enable for products that were already in the reminder system
            // (i.e. not undefined — they were set to true or false before)
            if (updated[id] !== undefined && updated[id] !== false) {
              // Already enabled, keep as-is
            } else if (updated[id] === undefined && newProductIds.includes(id)) {
              // New product — do NOT auto-enable, let dialog handle
            } else if (updated[id] === false) {
              // User explicitly disabled — keep disabled
            }
          });
          localStorage.setItem('grocery-reminders', JSON.stringify(updated));
        }

        // Show dialog for new products to let user decide
        if (newProductIds.length > 0) {
          const newProducts = newProductIds
            .map(id => productMap[id])
            .filter(Boolean);
          if (newProducts.length > 0) {
            setCheckoutDialog(newProducts);
          }
        }
      } else {
        showToast('❌ 保存失败，请重试');
      }
    } catch {
      showToast('❌ 网络错误，请重试');
    }
    setCheckingOut(false);
  };

  const handleSaveReminders = async (reminders) => {
    const existing = JSON.parse(localStorage.getItem('grocery-reminders') || '{}');
    const existingDays = JSON.parse(localStorage.getItem('grocery-reminder-days') || '{}');

    for (const [idStr, config] of Object.entries(reminders)) {
      existing[idStr] = config.enabled;
      existingDays[idStr] = config.days;
    }

    localStorage.setItem('grocery-reminders', JSON.stringify(existing));
    localStorage.setItem('grocery-reminder-days', JSON.stringify(existingDays));

    // Sync frequency changes to backend API
    try {
      const updates = Object.entries(reminders).map(([idStr, config]) =>
        freqApi.update(parseInt(idStr), config.days)
      );
      await Promise.allSettled(updates);
    } catch { /* silent fail */ }

    setCheckoutDialog(null);
    showToast('提醒设置已保存 ✓');
  };

  const handleAdd = async (productId) => {
    const ok = await addItem(productId);
    if (ok) showToast('已添加到清单 ✓');
  };

  const handleClearAll = async () => {
    const yes = await confirm({
      title: '清空清单',
      message: '确定要清空整个购物清单吗？',
      confirmText: '清空',
      danger: true,
    });
    if (!yes) return;
    if (clearAll) {
      await clearAll();
      showToast('清单已清空');
    }
  };

  const homeSearchResults = useMemo(() => {
    if (!homeSearch.trim()) return [];
    const q = homeSearch.trim().toLowerCase();
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.aliases && p.aliases.some(a => a.toLowerCase().includes(q)))
    ).slice(0, 12);
  }, [homeSearch]);

  const isHomeSearching = homeSearch.trim().length > 0;

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      {/* ===== Inline Quick Search ===== */}
      <div className="search-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        <span className="search-bar__icon">🔍</span>
        <input
          className="search-bar__input"
          type="text"
          placeholder="快速搜索并添加商品..."
          value={homeSearch}
          onChange={e => setHomeSearch(e.target.value)}
        />
        {isHomeSearching && (
          <button
            onClick={() => setHomeSearch('')}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-full)',
              width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}
          >✕</button>
        )}
      </div>

      {/* Search Results */}
      {isHomeSearching && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          {homeSearchResults.length > 0 ? (
            <>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                找到 {homeSearchResults.length} 个商品
              </p>
              <div className="product-grid">
                {homeSearchResults.map(product => (
                  <ProductCard key={product.id} product={product} isInList={isInList(product.id)} onAdd={handleAdd} />
                ))}
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                没有找到「{homeSearch.trim()}」
              </p>
              <button className="btn btn--primary btn--sm" onClick={() => {
                setHomeSearch('');
                navigate('/browse');
              }}>
                ➕ 去分类页添加自定义商品
              </button>
            </div>
          )}
        </section>
      )}

      {/* ===== Shopping List ===== */}
      {hasItems && (
        <>
          <div className="action-bar">
            <button className="btn btn--primary btn--sm" onClick={completeAll}>✅ 全部完成</button>
            {completed.length > 0 && (
              <button className="btn btn--danger btn--sm" onClick={clearCompleted}>🗑️ 清除已完成</button>
            )}
            <button className="btn btn--danger btn--sm" onClick={handleClearAll}>🧹 清空清单</button>
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/browse')}>➕ 添加商品</button>
          </div>

          {pending.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="section-header">
                <h2 className="section-title">🛒 待购买</h2>
                <span className="section-subtitle">{pending.length} 件</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {pending.map(item => (
                  <div key={item.id} className="list-item">
                    <button className="list-item__checkbox" onClick={() => toggleItem(item.id)} />
                    <span className="list-item__emoji">{getIcon(item)}</span>
                    <div className="list-item__info">
                      <div className="list-item__name">{item.name}</div>
                      <input
                        type="text"
                        className="list-item__note-input"
                        placeholder="添加备注..."
                        value={item.note || ''}
                        onChange={e => updateNote(item.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
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
                      {item.note && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{item.note}</div>}
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

          <div className="glass-card" style={{ padding: 'var(--space-lg)', textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
            <p style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              共 {items.length} 件商品{completed.length > 0 && `，已勾选 ${completed.length} 件`}
            </p>
            {completed.length > 0 && completed.length < items.length && (
              <button
                className="btn btn--primary btn--full"
                onClick={async () => {
                  const yes = await confirm({
                    title: '🛒 确认保存已勾选？',
                    message: `将 ${completed.length} 件已勾选商品保存到历史记录，未勾选的 ${pending.length} 件将保留在清单中`,
                    confirmText: '确认保存',
                  });
                  if (yes) handleCheckout(true);
                }}
                disabled={checkingOut}
                style={{ marginBottom: 'var(--space-sm)' }}
              >
                {checkingOut ? '处理中...' : `✅ 保存已勾选 (${completed.length} 件)`}
              </button>
            )}
            <button
              className={`btn btn--full ${completed.length > 0 && completed.length < items.length ? 'btn--ghost' : 'btn--primary'}`}
              onClick={async () => {
                const yes = await confirm({
                  title: '📋 确认保存全部？',
                  message: `将清单中全部 ${items.length} 件商品保存到历史记录，清单将会清空`,
                  confirmText: '确认保存',
                });
                if (yes) handleCheckout(false);
              }}
              disabled={checkingOut}
            >
              {checkingOut ? '处理中...' : '📋 全部保存到历史'}
            </button>
          </div>
        </>
      )}

      {!hasItems && (
        <div className="empty-state" style={{ padding: 'var(--space-xl) var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <div className="empty-state__icon">📋</div>
          <p className="empty-state__title">购物清单是空的</p>
          <p className="empty-state__desc">点击下方推荐商品快速添加，或去分类页浏览</p>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/browse')} style={{ marginTop: 'var(--space-md)' }}>
            📦 去商品分类
          </button>
        </div>
      )}

      {/* ===== Purchase Reminders ===== */}
      {reminderItems.length > 0 && (
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="section-header">
            <h2 className="section-title">⏰ 购买提醒</h2>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => navigate('/settings')}
              style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
            >
              管理 →
            </button>
          </div>
          <div className="product-grid">
            {reminderItems.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isInList={isInList(product.id)}
                onAdd={handleAdd}
                subtitle={product.dueLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== Daily Picks ===== */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="section-header">
          <h2 className="section-title">💡 猜您需要</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="section-subtitle">每日精选</span>
            <RefreshButton onClick={() => setDailyKey(k => k + 1)} />
          </div>
        </div>
        <div className="product-grid">
          {dailyPicks.map(product => (
            <ProductCard key={product.id} product={product} isInList={isInList(product.id)} onAdd={handleAdd} />
          ))}
        </div>
      </section>

      {/* ===== Long-cycle Reminders ===== */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="section-header">
          <h2 className="section-title">🔔 别忘了补货</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="section-subtitle">日用消耗品</span>
            <RefreshButton onClick={() => setLongKey(k => k + 1)} />
          </div>
        </div>
        <div className="product-grid">
          {longCyclePicks.map(product => (
            <ProductCard key={product.id} product={product} isInList={isInList(product.id)} onAdd={handleAdd} />
          ))}
        </div>
      </section>

      {/* Checkout Dialog */}
      {checkoutDialog && (
        <CheckoutDialog
          newProducts={checkoutDialog}
          onClose={() => setCheckoutDialog(null)}
          onSave={handleSaveReminders}
        />
      )}

      {confirmNode}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
