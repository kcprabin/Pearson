import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Contexts/Authcontext";
import {Loader} from "../Components/Loader"

const Publicroute = () => {
  const auth = useAuth();

  if (!auth) return <Loader />;

  const { isAuthenticated, authChecked, user, isHotelOwner } = auth;

  if (!authChecked) return <Loader />;

  if (!isAuthenticated) return <Outlet />;

  if (user?.role === "hotelAdmin" || isHotelOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/choose" replace />;
};

export default Publicroute;