import { NavLink } from 'react-router-dom';
import { useShoppingList } from '../../hooks/useShoppingList';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { items } = useShoppingList();
  const { user } = useAuth();
  const activeCount = items.filter(i => !i.completed).length;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`} end>
        <span className="bottom-nav__icon">📋</span>
        <span>清单</span>
        {activeCount > 0 && <span className="list-count-badge">{activeCount}</span>}
      </NavLink>
      <NavLink to="/browse" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav__icon">🗂️</span>
        <span>分类</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav__icon">📊</span>
        <span>历史</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav__icon">⚙️</span>
        <span>设置</span>
      </NavLink>
      {user?.isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav__icon">🔧</span>
          <span>管理</span>
        </NavLink>
      )}
    </nav>
  );
}
