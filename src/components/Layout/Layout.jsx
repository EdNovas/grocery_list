import Header from './Header';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import { ShoppingListProvider } from '../../hooks/useShoppingList';

export default function Layout({ children }) {
  return (
    <ShoppingListProvider>
      <div className="app-layout">
        <SideNav />
        <div className="app-container">
          <Header />
          <main className="main-content">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </ShoppingListProvider>
  );
}
