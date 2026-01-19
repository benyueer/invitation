import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { tracker } from './utils/tracker.ts'
import 'virtual:uno.css'
import './index.css'

tracker

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>,
)
