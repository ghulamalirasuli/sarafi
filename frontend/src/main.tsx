import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemedToaster } from './components/ThemedToaster.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { LocaleProvider } from './context/LocaleContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <App />
            <ThemedToaster />
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
