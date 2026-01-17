import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { createBrowserClient } from "@supabase/ssr"

let supabase: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabase
}

export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
}

// Async thunks
export const checkAuthStatus = createAsyncThunk("auth/checkAuthStatus", async (_, { rejectWithValue }) => {
  try {
    const supabaseClient = getSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      user_metadata: user.user_metadata,
    }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to check auth status")
  }
})

export const signOut = createAsyncThunk("auth/signOut", async (_, { rejectWithValue }) => {
  try {
    const supabaseClient = getSupabaseClient()
    const { error } = await supabaseClient.auth.signOut()
    if (error) {
      return rejectWithValue(error.message)
    }
    return null
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to sign out")
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    resetAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
        } else {
          state.user = null
          state.isAuthenticated = false
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.user = null
        state.isAuthenticated = false
      })
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.loading = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setUser, clearError, resetAuth } = authSlice.actions
export default authSlice.reducer
