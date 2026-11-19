import { FaHotel, FaMobileAlt, FaChartLine, FaGlobe, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const AboutUs = () => {
  const navigateto=useNavigate();
  return (
    <motion.div
      className="bg-gray-50 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section className="relative h-[70vh] flex items-center justify-center text-white">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
          className="absolute w-full h-full object-cover"
          alt="hotel"
        />
        <div className="absolute inset-0 bg-black/60"></div>

        <motion.div
          className="relative text-center max-w-3xl px-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold mb-6">
            Connecting Hotels With Travelers
          </h1>

          <p className="text-lg mb-8">
            A modern hotel listing platform and mobile booking system that helps
            hotels increase visibility and manage reservations easily.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Register Your Hotel
          </motion.button>
        </motion.div>
      </section>

      {/* Who we are */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.img
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"
          className="rounded-xl shadow-xl"
          alt="hotel room"
          initial={{ x: -60, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5,delay:0.3 }}
        />

        <motion.div
          initial={{ x: 60, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-6">Who We Are</h2>
          <p className="text-gray-600 mb-4">
            Our platform connects hotels with travelers through a powerful web
            dashboard and a mobile booking application. Hotels can list their
            properties, manage availability, update pricing, and receive
            bookings directly from guests using the mobile app.
          </p>
          <p className="text-gray-600">
            Travelers get a simple way to discover and book hotels while hotels
            gain a digital system to manage reservations efficiently.
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-14">
            What Hotels Get From Our Platform
          </h2>

          <motion.div
            className="grid md:grid-cols-4 gap-8"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={item}
              className="bg-gray-50 p-8 rounded-xl shadow hover:shadow-lg transition"
            >
              <FaHotel className="text-3xl text-blue-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Hotel Listing</h3>
              <p className="text-gray-600 text-sm">
                Create property pages with rooms, images, amenities and details.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-gray-50 p-8 rounded-xl shadow hover:shadow-lg transition"
            >
              <FaMobileAlt className="text-3xl text-blue-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Mobile Booking</h3>
              <p className="text-gray-600 text-sm">
                Travelers discover and book hotels directly from the mobile app.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-gray-50 p-8 rounded-xl shadow hover:shadow-lg transition"
            >
              <FaChartLine className="text-3xl text-blue-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Booking Dashboard</h3>
              <p className="text-gray-600 text-sm">
                Manage reservations, availability, and pricing in real time.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-gray-50 p-8 rounded-xl shadow hover:shadow-lg transition"
            >
              <FaGlobe className="text-3xl text-blue-600 mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">More Visibility</h3>
              <p className="text-gray-600 text-sm">
                Reach travelers searching for accommodation on the platform.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-14">
            How It Works
          </h2>

          <div className="space-y-6">
            {[
              "Register your hotel on our platform.",
              "Add rooms, photos, amenities and pricing.",
              "Your hotel becomes visible in the mobile booking app.",
              "Travelers search and book rooms.",
              "Manage reservations from the hotel dashboard.",
            ].map((text, i) => (
              <motion.div
                key={i}
                className="flex items-center bg-white p-6 rounded-lg shadow"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <FaCheckCircle className="text-green-500 text-xl mr-4" />
                {text}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <motion.div className="max-w-3xl mx-auto px-6"
         initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}>
          <h2 className="text-4xl font-bold mb-6">
            Grow Your Hotel Business
          </h2>

          <p className="mb-8 text-lg">
            Join our platform and connect with travelers actively searching for hotels through our mobile booking app.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer"
             onClick={()=>{navigateto("/register")}}
          >
            Register Your Hotel
          </motion.button>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default AboutUs;