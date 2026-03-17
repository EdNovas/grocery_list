import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { list as listApi } from '../services/api';
import { PRODUCTS } from '../data/products';

const productMap = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const ShoppingListContext = createContext(null);

export function ShoppingListProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const data = await listApi.get();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Cross-device sync: refetch when page becomes visible
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchList();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchList]);

  const addItem = async (productId, quantity = 1) => {
    try {
      const product = productMap[productId];
      const name = product?.name || '';
      const category = product?.category || '';
      await listApi.add(productId, quantity, '', name, category);
      await fetchList();
      return true;
    } catch {
      return false;
    }
  };

  const removeItem = async (id) => {
    try {
      await listApi.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleItem = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await listApi.update(id, { completed: item.completed ? 0 : 1 });
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, completed: i.completed ? 0 : 1 } : i)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return removeItem(id);
    try {
      await listApi.update(id, { quantity });
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, quantity } : i)
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Debounced note update — update local state immediately, debounce API call
  const noteTimers = useRef({});
  const updateNote = useCallback((id, note) => {
    // Optimistic: update local state immediately so input stays responsive
    setItems(prev => prev.map(i => i.id === id ? { ...i, note } : i));

    // Debounce API call (500ms)
    clearTimeout(noteTimers.current[id]);
    noteTimers.current[id] = setTimeout(async () => {
      try {
        await listApi.update(id, { note });
      } catch (err) {
        console.error('Failed to save note:', err);
      }
    }, 500);
  }, []);

  const completeAll = async () => {
    try {
      await listApi.completeAll();
      setItems(prev => prev.map(i => ({ ...i, completed: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearCompleted = async () => {
    try {
      await listApi.clearCompleted();
      setItems(prev => prev.filter(i => !i.completed));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      // Clear completed first, then mark all as completed and clear
      await listApi.completeAll();
      await listApi.clearCompleted();
      setItems([]);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const checkout = async () => {
    try {
      const result = await listApi.checkout();
      if (result.ok) {
        setItems([]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Checkout failed:', err);
      return false;
    }
  };

  const isInList = (productId) => {
    return items.some(i => i.product_id === productId);
  };

  return (
    <ShoppingListContext.Provider value={{
      items, loading, addItem, removeItem, toggleItem,
      updateQuantity, updateNote, completeAll, clearCompleted, clearAll, checkout,
      isInList, fetchList,
    }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (!context) {
    return { items: [], loading: true, isInList: () => false };
  }
  return context;
}
