import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 루트 컴포넌트 렌더링
createRoot(document.getElementById('root')).render( 
  <StrictMode>
    <App />
  </StrictMode>,
)
