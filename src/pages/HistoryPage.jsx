import { useState, useEffect } from 'react';
import { history as historyApi } from '../services/api';
import { PRODUCTS } from '../data/products';
import { useShoppingList } from '../hooks/useShoppingList';
import { useConfirm } from '../components/Dialogs';

const productMap = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const getIcon = (item) => {
  const prod = productMap[item.product_id];
  if (prod?.icon) return <img src={prod.icon} alt={item.name} style={{ width: 22, height: 22, objectFit: 'contain' }} />;
  return item.emoji || '🛒';
};

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function HistoryPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const { addItem } = useShoppingList();
  const [confirmNode, confirm] = useConfirm();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await historyApi.get();
      const grouped = {};
      (data.history || []).forEach(item => {
        // Convert to local date for correct grouping
        const d = new Date(item.purchased_at);
        const localDate = isNaN(d.getTime())
          ? (item.purchased_at?.split('T')[0] || '未知日期')
          : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const localTime = isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        if (!grouped[localDate]) grouped[localDate] = { items: [], time: localTime };
        grouped[localDate].items.push(item);
      });

      const sortedGroups = Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, { items, time }]) => ({ date, items, time }));

      setGroups(sortedGroups);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await historyApi.deleteItem(itemId);
      setGroups(prev => {
        return prev.map(g => ({
          ...g,
          items: g.items.filter(i => i.id !== itemId)
        })).filter(g => g.items.length > 0);
      });
      showToast('已删除');
    } catch {
      showToast('删除失败');
    }
  };

  const handleDeleteGroup = async (date) => {
    const yes = await confirm({
      title: '删除购物记录',
      message: '确定要删除这次购物记录吗？',
      confirmText: '删除',
      danger: true,
    });
    if (!yes) return;
    try {
      await historyApi.deleteByDate(date);
      setGroups(prev => prev.filter(g => g.date !== date));
      showToast('已删除该次购物记录');
    } catch {
      showToast('删除失败');
    }
  };

  const handleClearAll = async () => {
    const yes = await confirm({
      title: '清空历史',
      message: '确定要清空所有购买历史吗？此操作不可恢复。',
      confirmText: '清空',
      danger: true,
    });
    if (!yes) return;
    try {
      await historyApi.deleteAll();
      setGroups([]);
      showToast('历史记录已清空');
    } catch {
      showToast('清空失败');
    }
  };

  const formatDate = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const dayNum = parseInt(parts[2]);
      if (isNaN(year) || isNaN(month) || isNaN(dayNum)) return dateStr;

      const d = new Date(year, month, dayNum);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return '今天';
      if (diffDays === 1) return '昨天';

      const weekday = WEEKDAYS[d.getDay()];
      return `${month + 1}月${dayNum}日 ${weekday}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="page-enter">
      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📊</div>
          <p className="empty-state__title">暂无购买记录</p>
          <p className="empty-state__desc">完成购物后会在这里显示历史记录</p>
        </div>
      ) : (
        <>
          <div className="action-bar" style={{ marginBottom: 'var(--space-lg)' }}>
            <button className="btn btn--danger btn--sm" onClick={handleClearAll}>
              🗑️ 清空历史
            </button>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
            <div className="glass-card stat-card">
              <div className="stat-card__value">{groups.length}</div>
              <div className="stat-card__label">购物次数</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-card__value">
                {groups.reduce((acc, g) => acc + g.items.length, 0)}
              </div>
              <div className="stat-card__label">商品总数</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-card__value">
                {new Set(groups.flatMap(g => g.items.map(i => i.product_id))).size}
              </div>
              <div className="stat-card__label">不同商品</div>
            </div>
          </div>

          {/* History Groups */}
          {groups.map(group => (
            <div key={group.date} className="history-group">
              <div className="history-group__date" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{formatDate(group.date)}{group.time ? ` ${group.time}` : ''}</span>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={async () => {
                      let added = 0;
                      for (const item of group.items) {
                        const ok = await addItem(item.product_id);
                        if (ok) added++;
                      }
                      showToast(`已添加 ${added} 件商品到清单`);
                    }}
                    style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', color: 'var(--color-primary)' }}
                    title="一键添加到清单"
                  >🛒 再买一次</button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleDeleteGroup(group.date)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', color: 'var(--text-tertiary)' }}
                    title="删除这次购物记录"
                  >🗑️ 删除</button>
                </div>
              </div>
              <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
                {group.items.map((item) => (
                  <div key={item.id} className="history-item">
                    <span className="history-item__emoji">{getIcon(item)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="history-item__name">{item.name}</span>
                      {item.note && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '1px' }}>{item.note}</div>}
                    </div>
                    <span className="history-item__qty">×{item.quantity}</span>
                    <button
                      className="history-item__delete"
                      onClick={() => handleDeleteItem(item.id)}
                      title="删除"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {confirmNode}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
