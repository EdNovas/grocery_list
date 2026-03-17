import { NavLink, useLocation } from 'react-router-dom';
import { useShoppingList } from '../../hooks/useShoppingList';

export default function Header() {
  const location = useLocation();

  const titles = {
    '/': '智能购物清单',
    '/browse': '商品分类',
    '/list': '我的清单',
    '/history': '购买历史',
    '/settings': '设置',
  };

  const title = titles[location.pathname] || '智能购物清单';

  return (
    <header className="app-header">
      <h1 className="app-header__title">
        <span className="emoji">🛒</span>
        {title}
      </h1>
    </header>
  );
}
