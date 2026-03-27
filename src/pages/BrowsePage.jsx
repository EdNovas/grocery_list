import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PRODUCTS, CATEGORIES, getSubCategories } from '../data/products';
import { useShoppingList } from '../hooks/useShoppingList';
import { products as productsApi } from '../services/api';
import { ProductEditModal } from '../components/Dialogs';

// Sanitize input — strip HTML tags, trim, limit length
function sanitize(str, maxLen = 50) {
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`;]/g, '').trim().slice(0, maxLen);
}

export default function BrowsePage() {
  const [activeCategory, setActiveCategory] = useState('vegetables');
  const [activeSub, setActiveSub] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🛒');
  const [customCategory, setCustomCategory] = useState('custom');
  const { addItem, isInList } = useShoppingList();
  const [toast, setToast] = useState('');
  const [justAddedId, setJustAddedId] = useState(null);
  const [customProducts, setCustomProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const longPressTimer = useRef(null);

  // Load custom products from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('grocery-custom-products') || '[]');
      setCustomProducts(saved);
    } catch { /* ignore */ }
  }, []);

  const allProducts = useMemo(() => {
    return [...customProducts, ...PRODUCTS];
  }, [customProducts]);

  const allCategories = useMemo(() => {
    const customCat = { id: 'custom', name: '自定义', icon: null };
    return [...CATEGORIES, customCat];
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const subCategories = useMemo(() => getSubCategories(activeCategory), [activeCategory]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.aliases && p.aliases.some(a => a.toLowerCase().includes(q)))
      );
      return result;
    }

    result = result.filter(p => p.category === activeCategory);
    if (activeSub) {
      result = result.filter(p => p.subCategory === activeSub);
    }
    return result;
  }, [activeCategory, activeSub, searchQuery, isSearching, allProducts]);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setActiveSub(null);
    setSearchQuery('');
  };

  const handleAdd = async (productId) => {
    const ok = await addItem(productId);
    if (ok) {
      setJustAddedId(productId);
      setToast('已添加到清单 ✓');
      setTimeout(() => { setToast(''); setJustAddedId(null); }, 400);
    }
  };

  const handleDeleteCustom = async (productId) => {
    try {
      await productsApi.deleteCustom(productId);
      const updated = customProducts.filter(p => p.id !== productId);
      setCustomProducts(updated);
      localStorage.setItem('grocery-custom-products', JSON.stringify(updated));
      setEditProduct(null);
      setToast('已删除 ✓');
      setTimeout(() => setToast(''), 1200);
    } catch (err) {
      setToast(`❌ 删除失败: ${err.message}`);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleEditSave = async (name, emoji) => {
    if (!editProduct) return;
    try {
      await productsApi.editCustom(editProduct.id, name, emoji);
      const updated = customProducts.map(p =>
        p.id === editProduct.id ? { ...p, name, emoji } : p
      );
      setCustomProducts(updated);
      localStorage.setItem('grocery-custom-products', JSON.stringify(updated));
      setEditProduct(null);
      setToast('已更新 ✓');
      setTimeout(() => setToast(''), 1200);
    } catch {
      setToast('❌ 更新失败');
      setTimeout(() => setToast(''), 1200);
    }
  };

  const startLongPress = useCallback((product) => {
    longPressTimer.current = setTimeout(() => {
      setEditProduct(product);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const name = sanitize(customName);
    if (!name) {
      setToast('⚠️ 商品名称不能为空');
      setTimeout(() => setToast(''), 1500);
      return;
    }

    // Check for duplicates
    const isDuplicate = allProducts.some(p => p.name === name);
    if (isDuplicate) {
      setToast(`⚠️ "${name}" 已存在，请勿重复添加`);
      setTimeout(() => setToast(''), 2000);
      return;
    }

    const emoji = sanitize(customEmoji, 5) || '🛒';
    // Always save custom products under 'custom' category
    const category = 'custom';

    try {
      const data = await productsApi.addCustom({ name, emoji, category });
      if (data.ok && data.product) {
        // Add to local custom products
        const newProduct = {
          id: data.product.id,
          name: data.product.name,
          emoji: data.product.emoji,
          category: data.product.category,
          icon: null,
          defaultFreqDays: 14,
          isCustom: true,
        };
        const updated = [newProduct, ...customProducts];
        setCustomProducts(updated);
        localStorage.setItem('grocery-custom-products', JSON.stringify(updated));

        setToast(`✓ "${name}" 已创建`);
        setCustomName('');
        setShowCustomForm(false);
        // Switch to custom category to show the new product
        setActiveCategory('custom');
      } else {
        setToast('❌ 创建失败');
      }
    } catch {
      setToast('❌ 网络错误');
    }
    setTimeout(() => setToast(''), 1500);
  };

  // Group products by sub-category
  const groupedProducts = useMemo(() => {
    if (activeSub || isSearching) return null;
    const groups = {};
    filteredProducts.forEach(p => {
      const key = p.subCategory || '其他';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredProducts, activeSub, isSearching]);

  const renderProduct = (product) => (
    <div
      key={product.id}
      className={`product-card ${isInList(product.id) ? 'in-list' : ''} ${justAddedId === product.id ? 'just-added' : ''}`}
      onClick={() => !isInList(product.id) && handleAdd(product.id)}
      onTouchStart={product.isCustom ? () => startLongPress(product) : undefined}
      onTouchEnd={product.isCustom ? cancelLongPress : undefined}
      onTouchCancel={product.isCustom ? cancelLongPress : undefined}
      onContextMenu={product.isCustom ? (e) => { e.preventDefault(); setEditProduct(product); } : undefined}
      style={{ position: 'relative' }}
    >
      {product.isCustom && (
        <button
          className="product-card__edit-btn"
          onClick={(e) => { e.stopPropagation(); setEditProduct(product); }}
          title="编辑"
        >✎</button>
      )}
      <span className="product-card__emoji">
        {product.icon
          ? <img src={product.icon} alt={product.name} loading="lazy" />
          : <span style={{ fontSize: '1.8rem' }}>{product.emoji || '🛒'}</span>
        }
      </span>
      <span className="product-card__name">{product.name}</span>
      <span className="product-card__add-icon">{isInList(product.id) ? '✓' : '+'}</span>
    </div>
  );

  return (
    <div className="page-enter">
      {/* Search */}
      <div className="search-bar">
        <span className="search-bar__icon">🔍</span>
        <input
          className="search-bar__input"
          type="text"
          placeholder="搜索商品..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {isSearching && (
          <button
            className="search-bar__clear"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-full)',
              width: '24px', height: '24px', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}
          >✕</button>
        )}
      </div>

      {/* Category Tabs — HIDDEN when searching */}
      {!isSearching && (
        <>
          <div className="category-tabs">
            {allCategories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.id === 'custom'
                  ? <span style={{ fontSize: '1rem' }}>📦</span>
                  : <img src={cat.icon} alt="" className="category-tab__icon" />
                }
                {' '}{cat.name}
              </button>
            ))}
          </div>

          {/* Sub-category Filter */}
          {subCategories.length > 1 && (
            <div className="sub-category-tabs">
              <button
                className={`sub-category-tab ${!activeSub ? 'active' : ''}`}
                onClick={() => setActiveSub(null)}
              >全部</button>
              {subCategories.map(sub => (
                <button
                  key={sub}
                  className={`sub-category-tab ${activeSub === sub ? 'active' : ''}`}
                  onClick={() => setActiveSub(sub)}
                >{sub}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Search result count */}
      {isSearching && (
        <div style={{ padding: 'var(--space-sm) 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          找到 {filteredProducts.length} 个商品
        </div>
      )}

      {/* Custom category: show add button prominently */}
      {activeCategory === 'custom' && !isSearching && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <button className="btn btn--primary btn--full" onClick={() => setShowCustomForm(true)}>
            ➕ 添加自定义商品
          </button>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        groupedProducts ? (
          Object.entries(groupedProducts).map(([subName, prods]) => (
            <section key={subName} className="sub-group">
              <h3 className="sub-group__title">{subName}</h3>
              <div className="product-grid">{prods.map(renderProduct)}</div>
            </section>
          ))
        ) : (
          <div className="product-grid" style={{ marginTop: 'var(--space-lg)' }}>
            {filteredProducts.map(renderProduct)}
          </div>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">{activeCategory === 'custom' ? '📦' : '🔍'}</div>
          <p className="empty-state__title">
            {activeCategory === 'custom' ? '还没有自定义商品' : '没有找到商品'}
          </p>
          <p className="empty-state__desc">
            {activeCategory === 'custom' ? '点击上方按钮添加您的自定义商品' : '试试其他关键词，或添加自定义商品'}
          </p>
          {activeCategory !== 'custom' && (
            <button className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-md)' }}
              onClick={() => setShowCustomForm(true)}>
              ➕ 添加自定义商品
            </button>
          )}
        </div>
      )}

      {/* Add custom button (for non-custom categories) */}
      {activeCategory !== 'custom' && !isSearching && (
        <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
          <button className="btn btn--ghost" onClick={() => setShowCustomForm(true)}>
            ➕ 添加自定义商品
          </button>
        </div>
      )}

      {/* Custom Product Modal */}
      {showCustomForm && (
        <div className="modal-overlay" onClick={() => setShowCustomForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-content__handle" />
            <h3 style={{ marginBottom: 'var(--space-lg)', fontWeight: 700 }}>添加自定义商品</h3>
            <form onSubmit={handleCustomSubmit}>
              <div className="form-group">
                <label className="form-label">商品名称</label>
                <input className="form-input" type="text" value={customName}
                  onChange={e => setCustomName(e.target.value)} placeholder="例如：薄荷糖"
                  autoFocus maxLength={50} />
              </div>
              <div className="form-group">
                <label className="form-label">图标 Emoji</label>
                <input className="form-input" type="text" value={customEmoji}
                  onChange={e => setCustomEmoji(e.target.value)}
                  style={{ width: '80px', fontSize: '1.5rem', textAlign: 'center' }} maxLength={5} />
              </div>
              <div className="form-group">
                <label className="form-label">分类</label>
                <select className="form-input" value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}>
                  <option value="custom">自定义</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="button" className="btn btn--ghost btn--full" onClick={() => setShowCustomForm(false)}>取消</button>
                <button type="submit" className="btn btn--primary btn--full">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProductEditModal
        open={!!editProduct}
        product={editProduct}
        onSave={handleEditSave}
        onDelete={() => editProduct && handleDeleteCustom(editProduct.id)}
        onClose={() => setEditProduct(null)}
      />

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
