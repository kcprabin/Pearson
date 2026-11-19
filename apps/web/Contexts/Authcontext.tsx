import { createContext } from 'react'
import { useContext } from 'react';


export type user={
  Name?:string,
  name?:string,
  Username:string,
  id:string,
  role:string,
  token:string,
  hotelId?: string,
  Hotelid?: string,
  isHotelOwner?:boolean
}

export type AuthContextType = {
  isAuthenticated: boolean;
  login: (form: { Username: string; password: string }) => Promise<user>;
  logout: () => Promise<void>;
  user: user|null;
  hotelId: string | null;
  refreshUser: () => Promise<void>;
  authChecked:boolean;
  isHotelOwner:boolean;
}

export const Authcontext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(Authcontext);
  return context;
};
