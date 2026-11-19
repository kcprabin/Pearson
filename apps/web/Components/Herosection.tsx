import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Typewriter } from "react-simple-typewriter";

const Herosection = () => {
  const navigateto = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center">

      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
        alt="Hotel"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <main className="relative z-10 flex flex-col justify-center items-center text-center px-6 text-white">

        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Typewriter
            words={[
              "Manage Your Hotel on Travallee",
              "Update Availability Instantly",
              "Handle Bookings with Ease",
              "Grow Your Hotel Business"
            ]}
            loop={0}
            cursor
            cursorStyle="|"
            typeSpeed={60}
            deleteSpeed={40}
            delaySpeed={1500}
          />
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl mb-8 max-w-xl text-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Login to access your hotel dashboard, update availability, manage bookings, and get your hotel listed for travelers to discover and book easily.
        </motion.p>

        <motion.div
          className="flex space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition cursor-pointer"
            onClick={() => navigateto("/login")}
          >
            Login
          </button>

          <button
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg shadow hover:bg-blue-50 transition cursor-pointer"
            onClick={() => navigateto("/register")}
          >
            Register
          </button>
        </motion.div>

      </main>

    </div>
  );
};

export default Herosection;