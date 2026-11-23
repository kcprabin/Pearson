import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Authprovider } from '../Contexts/Authprovider';
import router from '../Routes/Route';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Authprovider>
      <RouterProvider router={router} />
    </Authprovider>
  </StrictMode>,
);