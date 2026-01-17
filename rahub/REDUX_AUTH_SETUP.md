# Redux Auth State Management Implementation

## Overview
A Redux-based authentication state management system using Redux Toolkit has been implemented. This provides centralized, type-safe auth state management across the entire application.

## What Was Implemented

### 1. **Redux Store Setup** (`lib/store.ts`)
- Configured Redux store with Redux Toolkit
- Integrated auth slice reducer
- Exports typed `RootState` and `AppDispatch` for TypeScript support

### 2. **Auth Slice** (`lib/slices/authSlice.ts`)
- Manages auth state with Redux Toolkit
- **State shape:**
  ```typescript
  {
    user: AuthUser | null          // Currently logged-in user
    loading: boolean               // Loading state for async operations
    error: string | null           // Error message if any
    isAuthenticated: boolean       // Quick auth check
  }
  ```

- **Async Thunks:**
  - `checkAuthStatus()` - Verify user is still authenticated
  - `signOut()` - Sign out the user

- **Actions:**
  - `setUser()` - Manually set user data
  - `clearError()` - Clear error state
  - `resetAuth()` - Reset entire auth state

### 3. **Custom Hooks** (`lib/hooks.ts` & `lib/useAuth.ts`)
- **useAppDispatch** - Typed dispatch hook
- **useAppSelector** - Typed selector hook
- **useAuth()** - Custom hook combining auth state and actions

### 4. **Redux Provider** (`providers/ReduxProvider.tsx`)
- Client component wrapping Redux Provider
- Integrated into root layout

### 5. **Updated Components**
- **Root Layout** - Added ReduxProvider wrapper
- **Homepage** - Uses Redux auth state for user redirects
- **LandingNavbar** - Uses Redux auth state instead of local state

## How to Use Redux Auth in Components

### Basic Usage with `useAuth()` Hook
```tsx
"use client"

import { useAuth } from "@/lib/useAuth"

export function MyComponent() {
  const { user, loading, error, isAuthenticated, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.email}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    )
  }

  return <div>Not logged in</div>
}
```

### Advanced Usage with Redux Hooks
```tsx
"use client"

import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { checkAuthStatus, signOut } from "@/lib/slices/authSlice"

export function AdvancedComponent() {
  const dispatch = useAppDispatch()
  const { user, loading, isAuthenticated, error } = useAppSelector(state => state.auth)

  const handleCheckAuth = () => {
    dispatch(checkAuthStatus())
  }

  const handleSignOut = () => {
    dispatch(signOut())
  }

  return (
    // Your component JSX
  )
}
```

### In useEffect for Auth Checks
```tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"

export function ProtectedComponent() {
  const router = useRouter()
  const { checkAuth, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    checkAuth().then((action) => {
      if (!action.payload) {
        router.push("/auth/login")
      }
    })
  }, [checkAuth, router])

  if (loading) return <div>Loading...</div>

  return isAuthenticated ? <div>Protected Content</div> : null
}
```

## File Structure
```
lib/
  ├── store.ts                    # Redux store configuration
  ├── hooks.ts                    # Redux hooks (useAppDispatch, useAppSelector)
  ├── useAuth.ts                  # Custom useAuth hook
  └── slices/
      └── authSlice.ts            # Auth reducer and async thunks

providers/
  └── ReduxProvider.tsx           # Redux Provider wrapper

app/
  ├── layout.tsx                  # Root layout with ReduxProvider
  └── page.tsx                    # Homepage using Redux auth
```

## Migration Guide - Converting Components to Use Redux Auth

### Before (Local State with Supabase Client)
```tsx
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(...)

export function MyComponent() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  return <div>{user ? "Logged in" : "Not logged in"}</div>
}
```

### After (Redux Auth)
```tsx
import { useAuth } from "@/lib/useAuth"

export function MyComponent() {
  const { user, checkAuth, loading } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) return <div>Loading...</div>
  return <div>{user ? "Logged in" : "Not logged in"}</div>
}
```

## Benefits of Redux Auth State Management

1. **Centralized State** - Single source of truth for auth data
2. **Type Safety** - Full TypeScript support with typed actions and selectors
3. **Devtools Integration** - Redux DevTools for debugging
4. **Consistency** - Same auth state across entire app
5. **Performance** - Efficient selectors prevent unnecessary re-renders
6. **Testability** - Easy to test async operations and state changes
7. **No Prop Drilling** - No need to pass auth state through component props

## Using Redux DevTools

Redux Toolkit is configured to work with Redux DevTools. To debug:

1. Install [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools-extension)
2. Open DevTools in your browser
3. Navigate to Redux tab
4. See state changes, actions, and time travel through history

## Async Operation Patterns

### Dispatch and Handle Result
```tsx
const dispatch = useAppDispatch()

const handleCheckAuth = async () => {
  const action = await dispatch(checkAuthStatus())
  if (checkAuthStatus.fulfilled.match(action)) {
    // Success - user is logged in
  } else {
    // Failed or not logged in
  }
}
```

### Using Loading State
```tsx
const { loading } = useAppSelector(state => state.auth)

return (
  <button disabled={loading}>
    {loading ? "Loading..." : "Check Auth"}
  </button>
)
```

## Future Enhancements

1. **Auth Persistence** - Persist auth state to localStorage
2. **Token Refresh** - Auto-refresh tokens before expiry
3. **Social Auth** - Add Google, GitHub auth to Redux slice
4. **Role-Based Access** - Add role/permissions to auth state
5. **Multiple Auth Providers** - Extend slice for different auth methods
6. **Middleware** - Add Redux middleware for logging and analytics

## Common Issues & Solutions

### Issue: `Cannot find module '@supabase/ssr'`
**Solution:** Clear .next cache: `rm -rf .next && pnpm dev`

### Issue: State not updating in component
**Solution:** Use `useAuth()` hook instead of manually reading state. Hook properly subscribes to updates.

### Issue: User redirected to dashboard on page load
**Solution:** `checkAuthStatus()` is called automatically on app load. For guest-only pages, remove redirect logic.

## API Reference

### `useAuth()` Hook
```typescript
const {
  user: AuthUser | null          // Current user object
  loading: boolean               // Loading state
  error: string | null           // Error message
  isAuthenticated: boolean       // Quick auth check
  checkAuth: () => Promise       // Check auth status
  signOut: () => Promise         // Sign out user
} = useAuth()
```

### `useAppDispatch()` Hook
```typescript
const dispatch = useAppDispatch()
dispatch(checkAuthStatus())
dispatch(signOut())
```

### `useAppSelector()` Hook
```typescript
const authState = useAppSelector(state => state.auth)
// Returns: { user, loading, error, isAuthenticated }
```

## Testing

Example with Jest/Vitest:
```tsx
import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/lib/slices/authSlice"

const store = configureStore({
  reducer: { auth: authReducer }
})

// Test actions and reducers
const state = store.getState()
expect(state.auth.loading).toBe(true)
```

---

**Last Updated:** January 17, 2026
**Redux Version:** 2.11.2
**React Redux Version:** 9.2.0
