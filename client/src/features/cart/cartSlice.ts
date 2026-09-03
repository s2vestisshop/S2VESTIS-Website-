import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { cartApi, type AddToCartInput } from '@/api/cart';
import { toErrorMessage } from '@/api/client';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import type { Cart } from '@/types';

interface CartState {
  items: Cart['items'];
  subtotal: number;
  count: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** ids of line-items with an in-flight mutation, for per-row spinners */
  pendingItemIds: string[];
  adding: boolean;
  error: string | null;
}

/**
 * The backend is the source of truth (guest carts persist via the guestId
 * cookie). We additionally cache the last snapshot to localStorage so the
 * drawer/badge paint instantly on reload and survive brief API outages —
 * this is the "localStorage fallback" for guests.
 */
const cached = readStorage<Pick<Cart, 'items' | 'subtotal' | 'count'>>(STORAGE_KEYS.cartCache, {
  items: [],
  subtotal: 0,
  count: 0,
});

const initialState: CartState = {
  items: cached.items ?? [],
  subtotal: cached.subtotal ?? 0,
  count: cached.count ?? 0,
  status: 'idle',
  pendingItemIds: [],
  adding: false,
  error: null,
};

function persist(state: CartState) {
  writeStorage(STORAGE_KEYS.cartCache, {
    items: state.items,
    subtotal: state.subtotal,
    count: state.count,
  });
}

function applyCart(state: CartState, cart: Cart) {
  state.items = cart.items;
  state.subtotal = cart.subtotal;
  state.count = cart.count;
  state.status = 'ready';
  state.error = null;
  persist(state);
}

export const fetchCart = createAsyncThunk('cart/fetch', async () => cartApi.get());

export const addToCart = createAsyncThunk(
  'cart/add',
  async (input: AddToCartInput, { rejectWithValue }) => {
    try {
      return await cartApi.add(input);
    } catch (err) {
      return rejectWithValue(toErrorMessage(err));
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      return await cartApi.update(itemId, quantity);
    } catch (err) {
      return rejectWithValue(toErrorMessage(err));
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/remove',
  async (itemId: string, { rejectWithValue }) => {
    try {
      return await cartApi.remove(itemId);
    } catch (err) {
      return rejectWithValue(toErrorMessage(err));
    }
  }
);

export const clearCart = createAsyncThunk('cart/clear', async () => cartApi.clear());

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        if (state.count === 0) state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => applyCart(state, action.payload))
      .addCase(fetchCart.rejected, (state) => {
        // keep cached snapshot; just mark it
        state.status = state.count > 0 ? 'ready' : 'error';
      });

    builder
      .addCase(addToCart.pending, (state) => {
        state.adding = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.adding = false;
        applyCart(state, action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.adding = false;
        state.error = (action.payload as string) ?? 'Could not add to cart';
      });

    for (const thunk of [updateCartItem, removeCartItem]) {
      builder
        .addCase(thunk.pending, (state, action) => {
          const id =
            typeof action.meta.arg === 'string' ? action.meta.arg : action.meta.arg.itemId;
          if (!state.pendingItemIds.includes(id)) state.pendingItemIds.push(id);
        })
        .addCase(thunk.fulfilled, (state, action) => {
          const id =
            typeof action.meta.arg === 'string' ? action.meta.arg : action.meta.arg.itemId;
          state.pendingItemIds = state.pendingItemIds.filter((x) => x !== id);
          applyCart(state, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          const id =
            typeof action.meta.arg === 'string' ? action.meta.arg : action.meta.arg.itemId;
          state.pendingItemIds = state.pendingItemIds.filter((x) => x !== id);
          state.error = (action.payload as string) ?? 'Could not update cart';
        });
    }

    builder.addCase(clearCart.fulfilled, (state, action) => applyCart(state, action.payload));
  },
});

export const { clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
