import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const InitialNav = () => {
  
  const logoSrc = "/logo.png";

  const links = [
    { name: "Home", to: "/initialhome/herosection" },
    { name: "About Us", to: "aboutus" },
    { name: "Our Services", to: "services" },
    { name: "Contact Us", to: "contactus" },
    { name: "Pricing", to: "pricing" },
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
  <div className="flex items-center">
    <img src={logoSrc} alt="Travallee logo" className="h-12 w-85 object-cover rounded-2xl" />
  </div>

        <nav>
          <ul className="flex space-x-6">
            {links.map((link) => (
              <li key={link.to} className="relative">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `px-2 py-1 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      {isActive && (
                        <motion.div
                          layoutId="underline"
                          className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-600"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default InitialNav;