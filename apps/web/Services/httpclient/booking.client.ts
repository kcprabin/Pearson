import axios from "axios"

export const bookingAdmin=axios.create({
    baseURL:`${import.meta.env.VITE_API_BASE_URL_BOOKING_DETAILS_FROM_ADMIN}`,
    withCredentials:true
})

export const bookingClient=axios.create({
    baseURL:`${import.meta.env.VITE_API_BASE_URL_BOOKING}`,
    withCredentials:true
})


bookingClient.interceptors.request.use( (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  } )

bookingAdmin.interceptors.request.use( (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  } )
  