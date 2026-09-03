import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '@/api';
import { ApiRequestError, toErrorMessage } from '@/api/client';
import type { User } from '@/types';

export interface AuthRejection {
  message: string;
  fieldErrors?: { field: string; message: string }[];
}

const toRejection = (err: unknown): AuthRejection => ({
  message: toErrorMessage(err),
  fieldErrors: err instanceof ApiRequestError ? err.fieldErrors : undefined,
});

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  /** true until the first `fetchMe` resolves — gates protected routes */
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
};

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  return authApi.me();
});

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authApi.login(payload);
    } catch (err) {
      return rejectWithValue(toRejection(err));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (err) {
      return rejectWithValue(toRejection(err));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'guest';
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.status = 'guest';
        state.initialized = true;
      });

    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.user = action.payload;
          state.status = 'authenticated';
          state.initialized = true;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = 'guest';
          state.error =
            (action.payload as AuthRejection | undefined)?.message ?? 'Authentication failed';
        });
    }

    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.status = 'guest';
      state.error = null;
    });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
