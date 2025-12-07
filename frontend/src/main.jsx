import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import CustomAuthProvider from './providers/AuthProvider'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomAuthProvider>
          <App />
          <Toaster />
        </CustomAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)