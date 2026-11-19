import React, { useState } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../Contexts/Authcontext";

const Loginpage = () => {
  const navigateto = useNavigate();

  const auth = useAuth();
  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  const { login } = auth;

  const [form, setForm] = useState({
    Username: "",
    password: "",
  });

  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handlechange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      if (form.Username === "" || form.password === "") {
        setError("all fields are required");
        return;
      }

      const loggedInUser = await login(form);

      // Hotel admins go to the dashboard, regular users choose the next step
      if (loggedInUser?.role === "hotelAdmin" || loggedInUser?.isHotelOwner) {
        navigateto("/dashboard");
      } else {
        navigateto("/choose");
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.log("Login error response data:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    const authBaseUrl = (
      import.meta as ImportMeta & {
        env: { VITE_AUTH_API_BASE_URL: string };
      }
    ).env.VITE_AUTH_API_BASE_URL;

    window.location.href = `${authBaseUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-center mb-6"
        >
          Login
        </motion.h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm mt-2 text-center"
          >
            {error}
          </motion.p>
        )}

        <form className="space-y-4" onSubmit={loginUser}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              name="Username"
              value={form.Username}
              placeholder="Enter username"
              onChange={handlechange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                placeholder="Enter password"
                onChange={handlechange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-black cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            className="w-full py-2 bg-black text-white rounded-lg cursor-pointer"
          >
            Login
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-sm mb-2">Continue with</p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={handleGoogleLogin}
            className="w-full py-2 border rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              className="w-5 h-5"
            />
            Google
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          Don't have an account?{" "}
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateto("/register")}
            className="font-semibold text-black cursor-pointer underline underline-offset-4"
          >
            Register
          </motion.span>
        </motion.p>

      </motion.div>
    </div>
  );
};

export default Loginpage;