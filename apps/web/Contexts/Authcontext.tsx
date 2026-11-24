import { createContext, useContext } from 'react';

export type user = {
  Name?: string;
  name?: string;
  Username: string;
  id: string | number;
  role: string;
  token: string;
  hotelId?: string;
  Hotelid?: string;
  isHotelOwner?: boolean;
  restaurantId?: number | string;
  threadId?: string;
  phoneNumber?: string;
  address?: string;
  email?: string;
  ownerEmail?: string;
  ownerPhoneNumber?: string;
};

export type AuthContextType = {
  isAuthenticated: boolean;
  login: (form: { username: string; password: string }) => Promise<user>;
  loginAsDemo: () => user;
  logout: () => Promise<void>;
  user: user | null;
  hotelId: string | null;
  refreshUser: () => Promise<void>;
  authChecked: boolean;
  isHotelOwner: boolean;
  updateUser: (partial: Partial<user>) => void;
};

export const Authcontext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(Authcontext);
  return context;
};
