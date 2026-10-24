import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Admin from './containers/Admin/index.jsx';
import Login from './containers/Login/index.jsx';
import GlobalStyles from './styles/globalStyles.js';
import { ToastContainer } from 'react-toastify';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index.jsx';



export function App() {
  const isAdminPage = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const hasToken = window.localStorage.getItem('token') || window.sessionStorage.getItem('token')

  return isAdminPage && hasToken ? <Admin /> : <Login />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
    <GlobalStyles />
    <ToastContainer autoClose={2000} theme='colored'/>
  </StrictMode>,
)
