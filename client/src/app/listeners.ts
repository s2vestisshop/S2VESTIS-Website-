import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { login, logout, register } from '@/features/auth/authSlice';
import { fetchCart } from '@/features/cart/cartSlice';
import {
  fetchWishlist,
  mergeGuestWishlist,
  resetWishlist,
} from '@/features/wishlist/wishlistSlice';

export const listenerMiddleware = createListenerMiddleware();

// On login / register: the backend merges the guest cart into the user cart via
// the guestId cookie — pull the fresh cart, and push any guest wishlist ids up.
listenerMiddleware.startListening({
  matcher: isAnyOf(login.fulfilled, register.fulfilled),
  effect: async (_action, api) => {
    await Promise.allSettled([
      api.dispatch(mergeGuestWishlist()),
      api.dispatch(fetchCart()),
    ]);
  },
});

// On logout: fall back to the guest cart, drop the hydrated wishlist docs.
listenerMiddleware.startListening({
  actionCreator: logout.fulfilled,
  effect: async (_action, api) => {
    api.dispatch(resetWishlist());
    api.dispatch(fetchWishlist());
    api.dispatch(fetchCart());
  },
});
