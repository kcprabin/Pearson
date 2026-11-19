import React, { useState } from "react";
import { motion } from "framer-motion";
import axios, { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/Authcontext";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const presetEmail = (location.state as any)?.email || "";

  const [email, setEmail] = useState(presetEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !otp) {
      setError("Email and OTP are required");
      return;
    }

    if (!/^\d{4}$/.test(otp)) {
      setError("OTP must be a 4-digit code");
      return;
    }

    setLoading(true);
    try {
      const resp = await axios.post(`${import.meta.env.VITE_AUTH_API_BASE_URL}/verify-otp`, {
        email,
        otp,
        type: "register",
      });

      if (!resp.data || resp.data.success !== true) {
        setError(resp.data?.message || "Verification failed");
        return;
      }

      const user = resp.data.data;
      const role = user?.role || "user";


      setSuccess(resp.data.message || "OTP verified — account created.");

      if (role === "hotelAdmin" || role === "hoteladmin") {
        navigate("/dashboard");
        return;
      }

      setShowPostOptions(true);
    } catch (err: unknown) {
      const e = err as AxiosError<{ message?: string }>;
      setError(e.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const [showPostOptions, setShowPostOptions] = useState(false);

    const auth=useAuth();
  if(!auth){
    return;
  }

  const {logout}=auth;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"
      >

            <button
          onClick={async() => {await logout(); navigate('/login')}}
          className="absolute top-4 left-4 text-sm text-gray-500 hover:text-black flex items-center gap-1 transition"
        >
          ← Back
        </button>

        <motion.h2
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-center mb-6"
        >
          Verify OTP
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

        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 text-sm mt-2 text-center"
          >
            {success}
          </motion.p>
        )}

        <form className="space-y-4 mt-4" onSubmit={handleVerify}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium mb-1">OTP</label>
            <input
              type="text"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the OTP sent to your email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </motion.button>
        </form>

        <motion.p className="mt-4 text-sm text-center text-gray-600">
          Didn't receive OTP? <span
            onClick={async () => {
              try {
                setError("");
                setSuccess("");
                await axios.post(`${import.meta.env.VITE_AUTH_API_BASE_URL}/register`, {
                  Username: "",
                  Name: "",
                  email,
                  password: "",
                });
                setSuccess("OTP resent if the email was valid.");
              } catch {
                setError("Failed to resend OTP");
              }
            }}
            className="font-semibold text-black cursor-pointer underline underline-offset-2"
          >
            Resend
          </span>
        </motion.p>
        {showPostOptions && (
          <div className="mt-6 text-center">
            <p className="mb-3">Your account is ready. What would you like to do next?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate('/login')} className="py-2 px-4 bg-gray-200 rounded">Go to App / Login</button>
              <button onClick={() => navigate('/registerhotel')} className="py-2 px-4 bg-black text-white rounded">Register a Hotel</button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default VerifyOTP;
