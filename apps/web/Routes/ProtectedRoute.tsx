import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Contexts/Authcontext';

const Loading = () => (
  <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>
);

const ProtectedRoute = () => {
  const auth = useAuth();

  if (!auth || !auth.authChecked) {
    return <Loading />;
  }

  return auth.isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
