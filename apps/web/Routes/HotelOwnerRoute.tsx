import {useAuth} from "../Contexts/Authcontext"
import {Outlet, Navigate} from "react-router-dom"
import {Loader} from "../Components/Loader"

const HotelOwnerRoute = () => {

  const auth=useAuth()

  if(!auth){
    return <Loader/>;
  }

  const {isAuthenticated, authChecked, isHotelOwner}=auth;

  if(!authChecked){
    return <Loader/>;
  }

  return (isAuthenticated && isHotelOwner)
    ? <Outlet />
    : <Navigate to="/registerhotel" replace />;
}

export default HotelOwnerRoute
