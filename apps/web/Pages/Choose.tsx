import { useAuth } from "../Contexts/Authcontext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Choose = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { logout } = auth;

  const handleGoToApp = async () => {
    try {
      await logout();
    } finally {
      navigate("/initialhome/herosection", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-bold text-center mb-3">Welcome</h1>
        <p className="text-center text-gray-600 mb-6">
          Choose how you want to continue.
        </p>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleGoToApp}
            className="w-full py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition"
          >
            Go to App
          </button>

          <button
            type="button"
            onClick={() => navigate("/registerhotel")}
            className="w-full py-3 rounded-lg border border-black text-black font-medium hover:bg-gray-50 transition"
          >
            Register My Hotel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Choose;
