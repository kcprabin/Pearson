import { bookingAdmin, bookingClient } from "./httpclient/booking.client"

export interface CreateBookingPayload {
  roomId: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  paymentMethod: "COD" | "ESEWA" | "KHALTI";
  Name: string;
  email: string;
}

export interface updateBookingPayload {
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  bookingPayment: "PAID" | "NOTPAID";
}

export const getGuestStatus = (bookingId: string) => {
    return bookingAdmin.get(`/guest-status/${bookingId}`)
}

export const createBooking = (data: CreateBookingPayload) =>{
 return bookingClient
    .post("/create-booking-hotel", data)
    .then((res) => res.data);
}

export const getGuestStatusByHotelId = (hotelId: string) => {
  return bookingClient.get(`/guest-status/${hotelId}`);
}

export const getTotalIncome = (hotelId: string) => {
  return bookingClient.get(`/calculate-income/${hotelId}`);
}

export const getPendingIncome = (hotelId: string) => {
  return bookingClient.get(`/calculate-pending-income/${hotelId}`);
}

export const updateBooking = (bookingId: string,data:CreateBookingPayload) => {
  return bookingClient.post(`/update-booking/${bookingId}`,data);
}