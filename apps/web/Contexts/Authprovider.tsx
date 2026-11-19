import React, { useEffect, useState } from 'react'
import { Authcontext } from './Authcontext'
import axios from "axios";
import type { user } from './Authcontext';

export const Authprovider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<user | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(() => {
    return localStorage.getItem("hotelId");
  });
  const [authChecked, setAuthChecked] = useState(false);

  const isAuthenticated = !!user;

  const resolveHotelId = (data: user | null) => {
    return data?.hotelId || data?.Hotelid || null;
  };

  const syncHotelId = (data: user | null) => {
    const nextHotelId = resolveHotelId(data);
    setHotelId(nextHotelId);

    if (nextHotelId) {
      localStorage.setItem("hotelId", nextHotelId);
    } else {
      localStorage.removeItem("hotelId");
    }
  };

  useEffect(() => {
    const initAuth = async () => {
    if(!authChecked) {
        try {
        const res = await axios.get(
          `${import.meta.env.VITE_AUTH_API_BASE_URL}/profile`,
          { withCredentials: true }
        );

        setUser(res.data.data);
            localStorage.setItem("token", res.data.data.refreshToken);
        syncHotelId(res.data.data);
      } catch(err) {
        console.log("initAuth failed:", err);
        setUser(null);
        setHotelId(null);
      } finally {
        setAuthChecked(true);
      }
    };
    }
    
    initAuth();
  }, []);

  const login = async (form: { Username: string; password: string }) => {
    const res = await axios.post(
      `${import.meta.env.VITE_AUTH_API_BASE_URL}/login`,
      form,
      { withCredentials: true }
    );
    setUser(res.data.data);
    localStorage.setItem("token", res.data.data.token);
      console.log("login response:", res.data); 
    syncHotelId(res.data.data);
    setAuthChecked(true);
    return res.data.data;
  };

  const logout = async () => {
    await axios.post(
      `${import.meta.env.VITE_AUTH_API_BASE_URL}/logout`,
      {},
      { withCredentials: true }
    );

    setUser(null);
    setHotelId(null);
    localStorage.removeItem("hotelId");
    localStorage.removeItem("token");
  };

  const refreshUser = async () => {
  try {

    const res = await axios.get(
      `${import.meta.env.VITE_AUTH_API_BASE_URL}/profile`,
      {
        withCredentials: true,
      }
    );

    setUser(res.data.data);
    syncHotelId(res.data.data);

  } catch {
    setUser(null);
    setHotelId(null);
    localStorage.removeItem("token");
  }
};
  return (
    <Authcontext.Provider
      value={{
        user,
        hotelId,
        login,
        logout,
        isAuthenticated,
        authChecked,
        refreshUser,
        isHotelOwner: user?.role=="hotelAdmin",
      }}
    >
   
      {authChecked && children}
    </Authcontext.Provider>
  );
};


