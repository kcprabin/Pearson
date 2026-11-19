import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  const logoSrc = "/logo-short.png";

  return (
    <footer className="bg-linear-to-r from-blue-800 via-blue-900 to-indigo-900 text-gray-200 pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-start">

        {/* Logo / Brand + CTA */}
        <div className="text-center md:text-left flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-2">
            <img src={logoSrc} alt="Travallee logo" className="h-12 w-12 object-cover rounded-2xl" />
            <h2 className="text-3xl font-bold text-white">Travallee</h2>
          </div>
          <p className="text-gray-300 text-sm">
            Connecting hotels with travelers. Manage your property, grow your business, and reach more guests.
          </p>
        </div>

        {/* Social / Contact */}
        <div className="text-center md:text-right">
          <h3 className="font-semibold text-white mb-2">Follow Us</h3>

          <div className="flex justify-center md:justify-end space-x-4 mb-4">

            {/* Facebook Link */}
            <a
              href="https://www.facebook.com/kcprabin09"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF className="text-xl hover:text-blue-500 cursor-pointer transition transform hover:scale-110" />
            </a>

            {/* Instagram Link */}
            <a
              href="https://www.instagram.com/kc_prabinn/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram className="text-xl hover:text-pink-500 cursor-pointer transition transform hover:scale-110" />
            </a>

            {/* Twitter Link */}
            <a
              href="https://twitter.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter className="text-xl hover:text-blue-400 cursor-pointer transition transform hover:scale-110" />
            </a>

            {/* WhatsApp Link */}
            <a
              href="https://wa.me/9779768553969"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="text-xl hover:text-green-500 cursor-pointer transition transform hover:scale-110" />
            </a>

          </div>

          <p className="text-gray-400 text-sm flex items-center justify-center md:justify-end gap-2">
            <img src={logoSrc} alt="Travallee logo" className="h-4 w-4 object-contain opacity-80" />
            <span>&copy; 2026 Travallee. All rights reserved.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;