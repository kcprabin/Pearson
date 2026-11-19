/* eslint-disable react-native/no-raw-text */
import { motion } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


// Detect platform
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isWeb = !isReactNative;

// Platform-specific components
let TextComponent: any = 'span';
let ViewComponent: any = 'div';
let TouchableComponent: any = 'div';
let Linking: any = null;

// Only import React Native modules if in React Native environment
if (isReactNative) {
  try {
    // @ts-ignore
    const RN = require('react-native');
    TextComponent = RN.Text;
    ViewComponent = RN.View;
    TouchableComponent = RN.TouchableOpacity;
    Linking = RN.Linking;
  } catch (error) {
    console.warn('React Native modules not available');
  }
}

const Contact = () => {
  const navigateto = useNavigate();


  // Function to open Gmail
  const openGmail = (email: string) => {
    if (isReactNative && Linking) {
      // React Native: Open email app
      Linking.openURL(`mailto:${email}`);
    } else {
      // Web: Open Gmail in new tab
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`,
        '_blank'
      );
    }
  };

  // Function to open Google Maps
  const openGoogleMaps = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    
    if (isReactNative && Linking) {
      // React Native: Open Google Maps app
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`);
    } else {
      // Web: Open Google Maps in new tab
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
        '_blank'
      );
    }
  };

  // Contact items data with click handlers - Removed actionText
  const contactItems = [
    {
      icon: <FaPhoneAlt className="text-3xl text-blue-600 mx-auto mb-4" />,
      title: "Phone",
      text: "+977 98XXXXXXXX",
      isClickable: false,
      onClick: undefined,
    },
    {
      icon: <FaEnvelope className="text-3xl text-blue-600 mx-auto mb-4" />,
      title: "Email",
      text: "kcprabin2063@gmail.com",
      isClickable: true,
      onClick: () => openGmail("kcprabin2063@gmail.com"),
    },
    {
      icon: <FaMapMarkerAlt className="text-3xl text-blue-600 mx-auto mb-4" />,
      title: "Location",
      text: "Kathmandu, Nepal",
      isClickable: true,
      onClick: () => openGoogleMaps("Kathmandu, Nepal"),
    },
  ];

  // Web Version
  if (isWeb) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Hero */}
        <section className="relative h-[45vh] flex items-center justify-center text-center text-white">
          <img
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"
            className="absolute inset-0 w-full h-full object-cover"
            alt="contact"
          />
          <div className="absolute inset-0 bg-black/60"></div>

          <motion.div
            className="relative px-6 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get In Touch With Us
            </h1>
            <p className="text-lg text-gray-200">
              Have questions about listing your hotel or managing bookings on Travallee? Reach out via phone, email, or visit us in Kathmandu.
            </p>
          </motion.div>
        </section>

        {/* Contact Cards */}
        <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
          {contactItems.map((item, index) => (
            <motion.div
              key={index}
              className={`bg-white p-8 rounded-xl shadow-md text-center transition transform hover:-translate-y-2 ${
                item.isClickable 
                  ? "cursor-pointer hover:shadow-lg hover:bg-blue-50" 
                  : ""
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
              }}
              onClick={item.onClick}
            >
              {item.icon}
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className={`text-gray-600 ${
                item.isClickable ? "hover:text-blue-600 transition-colors" : ""
              }`}>
                {item.text}
              </p>
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
              Ready to List Your Hotel?
            </h2>
            <p className="mb-6 text-lg max-w-xl mx-auto">
              Join Travallee and start connecting your hotel with travelers using our mobile booking platform.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer"
              onClick={() => {
                navigateto("/register");
              }}
            >
              Register Your Hotel
            </motion.button>
          </motion.div>
        </section>
      </div>
    );
  }

  // React Native Version
  return (
    <ViewComponent style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Hero */}
      <ViewComponent style={{ 
        height: 300, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#1e3a8a', 
        padding: 20 
      }}>
        <TextComponent style={{ 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: 'white', 
          textAlign: 'center', 
          marginBottom: 10 
        }}>
          Get In Touch With Us
        </TextComponent>
        <TextComponent style={{ 
          fontSize: 16, 
          color: '#e5e7eb', 
          textAlign: 'center' 
        }}>
          Have questions about listing your hotel or managing bookings on Travallee? Reach out via phone, email, or visit us in Kathmandu.
        </TextComponent>
      </ViewComponent>

      {/* Contact Cards */}
      <ViewComponent style={{ padding: 20 }}>
        {contactItems.map((item, index) => {
          const CardComponent = item.isClickable ? TouchableComponent : ViewComponent;
          return (
            <CardComponent
              key={index}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 12,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                alignItems: 'center',
              }}
              onPress={item.onClick}
              disabled={!item.isClickable}
            >
              <ViewComponent style={{ marginBottom: 10 }}>{item.icon}</ViewComponent>
              <TextComponent style={{ fontSize: 18, fontWeight: '600', marginBottom: 5 }}>
                {item.title}
              </TextComponent>
              <TextComponent style={{ color: '#4b5563', textAlign: 'center' }}>
                {item.text}
              </TextComponent>
            </CardComponent>
          );
        })}
      </ViewComponent>


      {/* CTA */}
      <ViewComponent style={{ backgroundColor: '#2563eb', padding: 40, alignItems: 'center' }}>
        <TextComponent style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10 }}>
          Ready to List Your Hotel?
        </TextComponent>
        <TextComponent style={{ fontSize: 16, color: '#bfdbfe', textAlign: 'center', marginBottom: 20 }}>
          Join Travallee and start connecting your hotel with travelers using our mobile booking platform.
        </TextComponent>
        <TouchableComponent
          style={{
            backgroundColor: 'white',
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 8,
          }}
          onPress={() => navigateto("/register")}
        >
          <TextComponent style={{ color: '#2563eb', fontWeight: '600', fontSize: 16 }}>
            Register Your Hotel
          </TextComponent>
        </TouchableComponent>
      </ViewComponent>
    </ViewComponent>
  );
};

export default Contact;