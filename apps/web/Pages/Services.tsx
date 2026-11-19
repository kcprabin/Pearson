import { motion } from "framer-motion";
import { FaHotel, FaMobileAlt, FaChartLine, FaCalendarCheck, FaImage, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Services = () => {
  const navigateto = useNavigate();

  const cards = [
    {
      
      icon: <FaHotel className="text-4xl text-blue-600 mb-4" />,
      title: "Hotel Listing",
      text: "Register your hotel and showcase rooms, facilities, amenities, and services to travelers searching for accommodation.",
    },
    {
      icon: <FaMobileAlt className="text-4xl text-blue-600 mb-4" />,
      title: "Mobile App Exposure",
      text: "Your property becomes visible to users browsing and booking hotels through the Travallee mobile application.",
    },
    {
      icon: <FaCalendarCheck className="text-4xl text-blue-600 mb-4" />,
      title: "Booking Management",
      text: "Receive reservations instantly and manage check-ins, bookings, and guest information from a single dashboard.",
    },
    {
      icon: <FaChartLine className="text-4xl text-blue-600 mb-4" />,
      title: "Business Growth",
      text: "Increase hotel occupancy and reach more travelers actively searching for accommodation.",
    },
    {
      icon: <FaImage className="text-4xl text-blue-600 mb-4" />,
      title: "Property Showcase",
      text: "Upload images, room details, pricing, and amenities to attract potential guests.",
    },
    {
      icon: <FaUsers className="text-4xl text-blue-600 mb-4" />,
      title: "Customer Reach",
      text: "Connect with thousands of travelers looking for hotels through our booking ecosystem.",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center text-center text-white">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
          className="absolute inset-0 w-full h-full object-cover"
          alt="hotel"
        />
        <div className="absolute inset-0 bg-black/60"></div>

        <motion.div
          className="relative px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Services For Hotel Partners
          </h1>

          <p className="text-lg text-gray-200 max-w-2xl">
            Everything you need to manage your hotel online, reach travelers, and handle bookings efficiently through the Travallee platform.
          </p>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">

        {cards.map((item, index) => (
          <motion.div
            key={index}
            className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.12,
            }}
          >
            {item.icon}
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.text}</p>
          </motion.div>
        ))}

      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16 text-center">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">
            Start Listing Your Hotel Today
          </h2>

          <p className="mb-6 text-lg max-w-xl mx-auto">
            Join Travallee and start receiving bookings from travelers using our mobile hotel booking application.
          </p>

          <motion.button
          whileHover={{scale:1.02}}
          whileTap={{scale:0.95}}
          transition={{type:"spring",stiffness:300}}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-200 transition cursor-pointer"
            onClick={() => navigateto("/register")}
          >
            Register Your Hotel
          </motion.button>
        </motion.div>

      </section>

    </div>
  );
};

export default Services;