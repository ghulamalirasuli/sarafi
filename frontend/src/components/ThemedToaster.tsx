import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'
import { useTheme } from '../context/ThemeContext'

export function ThemedToaster() {
  const { dark } = useTheme()
  return (
    <Toaster richColors closeButton position="top-right" theme={dark ? 'dark' : 'light'} />
  )
}
