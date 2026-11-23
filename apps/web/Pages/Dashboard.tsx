import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/Authcontext";

const Dashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await auth?.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <strong>Pearson</strong>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Logout
        </button>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;