import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"

const Register = () => {

  const navigateto = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    Username: "",
    Name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handlechange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const { confirmPassword, ...rest } = form;

      if (
        confirmPassword == "" ||
        rest.Username == "" ||
        rest.Name == "" ||
        rest.email == "" ||
        rest.password == ""
      ) {
        setError("all fields are required");
        return;
      }

      if (confirmPassword != rest.password) {
        setError("passwords should be same");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_AUTH_API_BASE_URL}/register`,
        rest
      );

      // After registering, navigate to OTP verification page with email
      navigateto("/verify-otp", { state: { email: rest.email } });

    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>
      setError(err.response?.data?.message || "registration failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <motion.h2
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-center mb-6">Create Account</motion.h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm mt-2 text-center">
            {error}
          </motion.p>
        )}

        <form className="space-y-4" onSubmit={registerUser}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
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
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="Name"
              type="text"
              value={form.Name}
              placeholder="Enter full name"
              onChange={handlechange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              placeholder="Enter email"
              onChange={handlechange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              placeholder="Enter password"
              onChange={handlechange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              placeholder="Enter password"
              onChange={handlechange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            Register
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-center">
          <p className="text-sm mb-2">Continue with</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={handleGoogleLogin}
            className="w-full py-2 border rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 cursor-pointer"
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
          Already have an account?{" "}
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateto("/login")}
            className="font-semibold text-black cursor-pointer underline underline-offset-4"
          >
            Login
          </motion.span>
        </motion.p>

      </motion.div>
    </div>
  );
};

export default Register;
