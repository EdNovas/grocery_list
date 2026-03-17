import { NavLink } from 'react-router-dom';
import { useShoppingList } from '../../hooks/useShoppingList';
import { useAuth } from '../../context/AuthContext';

export default function SideNav() {
  const { items } = useShoppingList();
  const { user } = useAuth();
  const activeCount = items.filter(i => !i.completed).length;

  const navItems = [
    { to: '/', icon: '📋', label: '购物清单', badge: activeCount || null, end: true },
    { to: '/browse', icon: '🗂️', label: '商品分类' },
    { to: '/history', icon: '📊', label: '购买历史' },
    { to: '/settings', icon: '⚙️', label: '设置' },
    ...(user?.isAdmin ? [{ to: '/admin', icon: '🔧', label: '管理后台' }] : []),
  ];

  return (
    <nav className="side-nav">
      <div className="side-nav__brand">
        <span className="side-nav__logo">🛒</span>
        <span className="side-nav__title">智能购物清单</span>
      </div>
      <div className="side-nav__links">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `side-nav__item ${isActive ? 'active' : ''}`}
          >
            <span className="side-nav__icon">{item.icon}</span>
            <span className="side-nav__label">{item.label}</span>
            {item.badge && <span className="side-nav__badge">{item.badge}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
