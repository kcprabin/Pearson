import { useEffect, useState, useCallback } from "react";
import { getGuestStatusByHotelId } from "../Services/booking.api";
import { useAuth } from "../Contexts/Authcontext";

export type GuestStayStatus = "CHECKED IN" | "CHECKED OUT" | "UPCOMING" | "UNKNOWN";
export type BookingPayment  = "NOTPAID" | "PAID";
export type PaymentMethod   = "COD" | "KHALTI" | string;

export interface Booking {
  status: GuestStayStatus;
  bookingName: string;
  bookingTotalNights: number;
  bookingCheckIn: string;
  bookingCheckOut: string;
  totalMoneySpent: number;
  bookingPayment: BookingPayment;
  bookingPaymentMethod: PaymentMethod;
  bookingRoomNumber: string;
}

export const useGuestStatus = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const auth    = useAuth();
  const hotelId = auth?.hotelId;

  const fetchGuestStatus = useCallback(async () => {
    if (!hotelId) return;

    try {
      setLoading(true);
      setError("");

      const data = await getGuestStatusByHotelId(hotelId);
      console.log(data.data);
      setBookings(data.data?.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load guest status");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchGuestStatus();
  }, [fetchGuestStatus]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchGuestStatus,
  };
};