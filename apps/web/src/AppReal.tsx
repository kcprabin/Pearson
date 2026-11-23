import { Navigate, BrowserRouter, Route, Routes } from 'react-router-dom';
import { Authprovider } from '../Contexts/Authprovider';
import { useAuth } from '../Contexts/Authcontext';
import Loginpage from '../Pages/Loginpage';

function ProtectedDashboard() {
  const auth = useAuth();

  if (!auth?.authChecked) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Pearson Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome, {auth.user?.name ?? auth.user?.Name ?? auth.user?.Username}
        </p>
        <button
          type="button"
          onClick={() => void auth.logout()}
          className="mt-6 rounded-lg bg-black px-4 py-2 text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AppReal() {
  return (
    <Authprovider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Loginpage />} />
          <Route path="/dashboard" element={<ProtectedDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Authprovider>
  );
}
