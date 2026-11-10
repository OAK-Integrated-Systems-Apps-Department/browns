import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles.css'
import * as bootstrap from 'bootstrap'
import App from './App'
;(window as any).bootstrap = bootstrap
createRoot(document.getElementById('root')!).render(<App />)
