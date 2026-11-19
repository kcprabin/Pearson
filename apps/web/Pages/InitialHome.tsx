import { Outlet } from "react-router-dom";
import InitialNav from "../Components/InitialNav";
import Footer from "../Components/Footer";

interface InitialHomeProps {
  children?: React.ReactNode;
}

const InitialHome = ({ children }: InitialHomeProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-blue-50 to-white font-sans">
      {/* Navbar */}
      <InitialNav />

      {/* Content */}
      {children || <Outlet />}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default InitialHome;