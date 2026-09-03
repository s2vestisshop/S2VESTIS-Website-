import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  cartDrawerOpen: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  /** transient toast messages */
  toasts: { id: string; message: string; tone: 'info' | 'success' | 'error' }[];
}

const initialState: UiState = {
  cartDrawerOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCartDrawer(state) {
      state.cartDrawerOpen = true;
    },
    closeCartDrawer(state) {
      state.cartDrawerOpen = false;
    },
    toggleCartDrawer(state) {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
    setMobileMenu(state, action: PayloadAction<boolean>) {
      state.mobileMenuOpen = action.payload;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.searchOpen = action.payload;
    },
    pushToast: {
      reducer(state, action: PayloadAction<UiState['toasts'][number]>) {
        state.toasts.push(action.payload);
      },
      prepare(message: string, tone: 'info' | 'success' | 'error' = 'info') {
        return { payload: { id: crypto.randomUUID(), message, tone } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  setMobileMenu,
  setSearchOpen,
  pushToast,
  dismissToast,
} = uiSlice.actions;
export default uiSlice.reducer;
