import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { fetchMe } from '@/features/auth/authSlice';
import { fetchCart } from '@/features/cart/cartSlice';
import { fetchWishlist } from '@/features/wishlist/wishlistSlice';
import { AppRoutes } from '@/router/AppRoutes';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Bootstrap session + server-backed state (guest cart works via cookie).
    dispatch(fetchMe())
      .unwrap()
      .catch(() => {})
      .finally(() => {
        dispatch(fetchCart());
        dispatch(fetchWishlist());
      });
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
