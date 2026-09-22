import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import type { ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import History from './pages/History'
import Account from './pages/Account'
import Pricing from './pages/Pricing'
import Templates from './pages/Templates'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { Privacy, RefundPolicy, Terms } from './pages/Legal'
import Welcome from './pages/Welcome'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/**
 * The router-independent shell. Kept separate from `App` so the build-time
 * prerenderer (src/entry-server.tsx) can render the exact same tree under a
 * StaticRouter and bake the text into the HTML that crawlers and AI assistants
 * actually read.
 */
export function AppShell() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            background: '#fffdf9',
            color: '#241528',
            border: '1px solid #ece3e6',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/generate" element={<ProtectedRoute><Generate /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
