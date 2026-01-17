import { useAppDispatch, useAppSelector } from "./hooks"
import { checkAuthStatus, signOut as signOutAction } from "./slices/authSlice"

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, loading, error, isAuthenticated } = useAppSelector((state) => state.auth)

  const checkAuth = () => {
    return dispatch(checkAuthStatus())
  }

  const signOut = () => {
    return dispatch(signOutAction())
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    checkAuth,
    signOut,
  }
}
