import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { wishlistApi } from '@/api/wishlist';
import { toErrorMessage } from '@/api/client';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import type { Product } from '@/types';
import type { RootState } from '@/app/store';

interface WishlistState {
  /** product ids — the canonical membership set (works for guests too) */
  ids: string[];
  /** hydrated product docs (populated for logged-in users / wishlist page) */
  items: Product[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: WishlistState = {
  ids: readStorage<string[]>(STORAGE_KEYS.wishlistGuestIds, []),
  items: [],
  status: 'idle',
  error: null,
};

const persistIds = (ids: string[]) => writeStorage(STORAGE_KEYS.wishlistGuestIds, ids);

/** Pull the server wishlist for a logged-in user. Guests keep their local ids. */
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_: void, { getState }) => {
    const authed = (getState() as RootState).auth.status === 'authenticated';
    if (!authed) return null;
    return wishlistApi.get();
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (product: Product, { getState, rejectWithValue }) => {
    const authed = (getState() as RootState).auth.status === 'authenticated';
    try {
      if (authed) await wishlistApi.add(product._id);
      return product;
    } catch (err) {
      return rejectWithValue(toErrorMessage(err));
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId: string, { getState, rejectWithValue }) => {
    const authed = (getState() as RootState).auth.status === 'authenticated';
    try {
      if (authed) await wishlistApi.remove(productId);
      return productId;
    } catch (err) {
      return rejectWithValue(toErrorMessage(err));
    }
  }
);

/** After login/register: push any guest ids to the server, then refetch. */
export const mergeGuestWishlist = createAsyncThunk(
  'wishlist/merge',
  async (_: void, { getState }) => {
    const ids = (getState() as RootState).wishlist.ids;
    await Promise.allSettled(ids.map((id) => wishlistApi.add(id)));
    return wishlistApi.get();
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    /** used when guest logs out — drop hydrated docs, keep nothing server-side */
    resetWishlist(state) {
      state.items = [];
    },
    hydrateItems(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
      state.ids = action.payload.map((p) => p._id);
      persistIds(state.ids);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = 'ready';
        if (action.payload) {
          state.items = action.payload.products;
          state.ids = action.payload.products.map((p) => p._id);
          persistIds(state.ids);
        }
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.status = 'error';
      });

    builder
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const product = action.payload;
        if (!state.ids.includes(product._id)) {
          state.ids.push(product._id);
          state.items.push(product);
          persistIds(state.ids);
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Could not update wishlist';
      });

    builder
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.ids = state.ids.filter((id) => id !== action.payload);
        state.items = state.items.filter((p) => p._id !== action.payload);
        persistIds(state.ids);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Could not update wishlist';
      });

    builder.addCase(mergeGuestWishlist.fulfilled, (state, action) => {
      state.items = action.payload.products;
      state.ids = action.payload.products.map((p) => p._id);
      persistIds(state.ids);
    });
  },
});

export const { resetWishlist, hydrateItems } = wishlistSlice.actions;
export default wishlistSlice.reducer;
