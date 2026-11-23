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

        const data = res.data.data;
        const authenticatedUser: user = {
          id: data.thread_id,
          Username: data.ownerName,
          name: data.restaurantName,
          Name: data.ownerName,
          role: 'hotelAdmin',
          token: localStorage.getItem('token') ?? '',
          hotelId: data.thread_id,
          Hotelid: data.thread_id,
          isHotelOwner: true,
        };
        setUser(authenticatedUser);
        syncHotelId(authenticatedUser);
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

  const login = async (form: { username: string; password: string }) => {
    const res = await axios.post(
      `${import.meta.env.VITE_AUTH_API_BASE_URL}/login`,
      form,
      { withCredentials: true }
    );

    const restaurant = res.data.data;
    const authenticatedUser: user = {
      id: restaurant.thread_id,
      Username: restaurant.ownerName,
      name: restaurant.restaurantName,
      Name: restaurant.ownerName,
      role: "hotelAdmin",
      token: restaurant.token,
      hotelId: restaurant.thread_id,
      Hotelid: restaurant.thread_id,
      isHotelOwner: true,
    };

    setUser(authenticatedUser);
    localStorage.setItem("token", authenticatedUser.token);
    syncHotelId(authenticatedUser);
    setAuthChecked(true);
    return authenticatedUser;
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

    const data = res.data.data;
    const authenticatedUser: user = {
      id: data.thread_id,
      Username: data.ownerName,
      name: data.restaurantName,
      Name: data.ownerName,
      role: 'hotelAdmin',
      token: localStorage.getItem('token') ?? '',
      hotelId: data.thread_id,
      Hotelid: data.thread_id,
      isHotelOwner: true,
    };
    setUser(authenticatedUser);
    syncHotelId(authenticatedUser);

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


