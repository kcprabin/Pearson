import React, { useEffect, useState, useCallback } from 'react';
import { Authcontext } from './Authcontext';
import axios from 'axios';
import type { user } from './Authcontext';

const DEMO_USER: user = {
  id: 1,
  restaurantId: 1,
  Username: 'sunrise_admin',
  name: 'Sunrise Bistro & Lounge',
  Name: 'Ram Sharma',
  role: 'hotelAdmin',
  token: 'demo-pearson-token-12345',
  hotelId: 'demo-thread-pearson-01',
  Hotelid: 'demo-thread-pearson-01',
  threadId: 'demo-thread-pearson-01',
  isHotelOwner: true,
  phoneNumber: '9800000000',
  address: '123 Lakeside Boulevard, Pokhara',
  email: 'contact@sunrisebistro.com',
  ownerEmail: 'ram@sunrisebistro.com',
  ownerPhoneNumber: '9811111111',
};

const AUTH_STORAGE_KEY = 'pearson_auth_user';

export const Authprovider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<user | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [hotelId, setHotelId] = useState<string | null>(() => {
    return localStorage.getItem('hotelId') || '1';
  });

  const [authChecked, setAuthChecked] = useState(false);

  const isAuthenticated = !!user;

  const resolveHotelId = (data: user | null) => {
    return data?.hotelId || data?.Hotelid || (data?.restaurantId ? String(data.restaurantId) : null);
  };

  const syncHotelId = useCallback((data: user | null) => {
    const nextHotelId = resolveHotelId(data);
    setHotelId(nextHotelId);

    if (nextHotelId) {
      localStorage.setItem('hotelId', nextHotelId);
    } else {
      localStorage.removeItem('hotelId');
    }

    if (data) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // If we already have stored demo or cached session, mark checked immediately
      if (user) {
        setAuthChecked(true);
        return;
      }

      const authBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:3000/hotel';

      try {
        const res = await axios.get(`${authBaseUrl}/profile`, {
          withCredentials: true,
          timeout: 2500,
        });

        const data = res.data.data;
        const authenticatedUser: user = {
          id: data.thread_id || 1,
          restaurantId: 1,
          Username: data.ownerName || 'Admin',
          name: data.restaurantName || 'Pearson Restaurant',
          Name: data.ownerName || 'Admin',
          role: 'hotelAdmin',
          token: localStorage.getItem('token') ?? 'bearer-token',
          hotelId: data.thread_id || '1',
          Hotelid: data.thread_id || '1',
          threadId: data.thread_id || '1',
          isHotelOwner: true,
        };
        setUser(authenticatedUser);
        syncHotelId(authenticatedUser);
      } catch (err) {
        console.log('initAuth check (using standalone mode if unauthenticated):', err);
      } finally {
        setAuthChecked(true);
      }
    };

    initAuth();
  }, [syncHotelId, user]);

  const login = async (form: { username: string; password: string }) => {
    const authBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:3000/hotel';

    try {
      const res = await axios.post(`${authBaseUrl}/login`, form, {
        withCredentials: true,
        timeout: 4000,
      });

      const restaurant = res.data.data;
      const authenticatedUser: user = {
        id: restaurant.id,
        restaurantId: restaurant.id,
        Username: restaurant.ownerName || form.username,
        name: restaurant.restaurantName,
        Name: restaurant.ownerName,
        role: 'hotelAdmin',
        token: restaurant.token,
        hotelId: restaurant.thread_id || String(restaurant.id),
        Hotelid: restaurant.thread_id || String(restaurant.id),
        threadId: restaurant.thread_id,
        isHotelOwner: true,
        phoneNumber: restaurant.phoneNumber,
        ownerPhoneNumber: restaurant.ownerPhoneNumber,
        address: restaurant.address,
        email: restaurant.email,
        ownerEmail: restaurant.ownerEmail,
      };

      setUser(authenticatedUser);
      localStorage.setItem('token', authenticatedUser.token || 'token');
      syncHotelId(authenticatedUser);
      setAuthChecked(true);
      return authenticatedUser;
    } catch (err) {
      // If backend is unavailable or demo credentials entered
      if (
        form.username.toLowerCase() === 'demo' ||
        form.username.toLowerCase() === 'admin' ||
        form.username === 'sunrise_admin'
      ) {
        return loginAsDemo();
      }
      throw err;
    }
  };

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    localStorage.setItem('token', DEMO_USER.token);
    syncHotelId(DEMO_USER);
    setAuthChecked(true);
    return DEMO_USER;
  };

  const logout = async () => {
    const authBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:3000/hotel';
    try {
      await axios.post(`${authBaseUrl}/logout`, {}, { withCredentials: true, timeout: 2000 });
    } catch {
      // Continue cleanup regardless
    }

    setUser(null);
    setHotelId(null);
    localStorage.removeItem('hotelId');
    localStorage.removeItem('token');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUser = (partial: Partial<user>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      syncHotelId(updated);
      return updated;
    });
  };

  const refreshUser = async () => {
    const authBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:3000/hotel';
    try {
      const res = await axios.get(`${authBaseUrl}/profile`, {
        withCredentials: true,
        timeout: 2500,
      });
      const data = res.data.data;
      updateUser({
        name: data.restaurantName,
        Username: data.ownerName,
        Name: data.ownerName,
      });
    } catch {
      // Keep cached user
    }
  };

  return (
    <Authcontext.Provider
      value={{
        user,
        hotelId,
        login,
        loginAsDemo,
        logout,
        isAuthenticated,
        authChecked,
        refreshUser,
        updateUser,
        isHotelOwner: user?.role === 'hotelAdmin',
      }}
    >
      {authChecked && children}
    </Authcontext.Provider>
  );
};
