import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import Loginpage from '../Pages/Loginpage';
import Dashboard from '../Pages/Dashboard';
import FeedbackPage from '../Pages/FeedbackPage';
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Loginpage />} />
      <Route path="/feedback/:restaurantId" element={<FeedbackPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>,
  ),
);

export default router;
