import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) return setCart({ items: [] });
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {}
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (itemId, type) => {
    if (!user) { toast.error('Please login to add items to cart'); return; }
    try {
      await api.post('/cart/add', { itemId, type });
      toast.success('Added to cart!');
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateQty = async (cartItemId, qty) => {
    try {
      await api.put('/cart/update', { itemId: cartItemId, qty });
      fetchCart();
    } catch {}
  };

  const removeItem = async (cartItemId) => {
    try {
      await api.delete(`/cart/remove/${cartItemId}`);
      fetchCart();
    } catch {}
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart({ items: [] });
    } catch {}
  };

  const itemCount = cart.items?.length || 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, addToCart, updateQty, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
