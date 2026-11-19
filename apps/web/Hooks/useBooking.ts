import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getBookingHistory } from "../Services/hotel.api";


type Status = "ALL" | "PAID" | "NOTPAID";

export type Booking = {
  id: string;
  userId: string;
  guest: string;
  email?: string;
  room: string;
  checkIn: string;
  checkOut: string;
  amount: string;
  status: Exclude<Status, "ALL">;
  bookingStatus: "CONFIRMED" | "PENDING" | "CANCELLED";
  paymentMethod?: string;
};

type HotelBookingHistoryEntry = {
  bookingId?: string;
  userId?: string;
  guestName?: string;
  roomNumber?: string;
  checkinDate?: string;
  checkoutDate?: string;
  totalPrice?: number;
  paymentMethod?: string;
  bookingPayment?: string;
  status?: string;
  stayDurationNights?: number;
  email?: string;
};

type IncomingBookingEvent = {
  bookingId?: string;
  userId?: string;
  userName?: string;
  name?: string;
  email?: string;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  stayDurationNights?: number;
  amount?: number | string;
  paymentMethod?: string;
  bookingPayment?: string;
  status?: string;
};

type StoredNotificationShape = {
  bookingId?: string;
  userId?: string;
  userName?: string;
  name?: string;
  email?: string;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  stayDurationNights?: number;
  amount?: number | string;
  paymentMethod?: string;
  bookingPayment?: string;
  status?: string;
  createdAt?: string;
};

const BOOKING_HISTORY_STORAGE_KEY = "recentBookingHistory";
const SOCKET_BASE_URL =
  import.meta.env.VITE_API_BASE_URL_ADMIN || "http://localhost:4001";
const NEW_BOOKING_HIGHLIGHT_MS = 10_000;
const MAX_BOOKINGS = 150;


const formatDisplayDate = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const normalizePaymentStatus = (
  status?: string
): Exclude<Status, "ALL"> => {
  if (status === "PAID" || status === "NOTPAID") return status;
  return "NOTPAID";
};

const normalizeBookingStatus = (
  status?: string
): "CONFIRMED" | "PENDING" | "CANCELLED" => {
  if (
    status === "CONFIRMED" ||
    status === "PENDING" ||
    status === "CANCELLED"
  )
    return status;
  return "PENDING";
};

const deduplicateById = (bookings: Booking[]): Booking[] =>
  bookings.filter(
    (item, index, array) => array.findIndex((c) => c.id === item.id) === index
  );

const mapHistoryBooking = (payload: HotelBookingHistoryEntry): Booking => ({
  id: payload.bookingId || `TMP-${Date.now()}`,
  userId: payload.userId || "-",
  guest: payload.guestName || payload.email || payload.userId || "Guest",
  email: payload.email,
  room: payload.roomNumber || "-",
  checkIn: formatDisplayDate(payload.checkinDate),
  checkOut: formatDisplayDate(payload.checkoutDate),
  amount:
    payload.totalPrice !== undefined ? `Rs. ${payload.totalPrice}` : "-",
  status: normalizePaymentStatus(payload.bookingPayment),
  bookingStatus: normalizeBookingStatus(payload.status),
  paymentMethod: payload.paymentMethod,
});

const mapIncomingBooking = (payload: IncomingBookingEvent): Booking => ({
  id: payload.bookingId || `TMP-${Date.now()}`,
  userId: payload.userId || "-",
  guest: payload.userName || payload.name || payload.email || "Guest",
  email: payload.email,
  room: payload.roomNumber || "-",
  checkIn: formatDisplayDate(payload.checkInDate),
  checkOut: formatDisplayDate(payload.checkOutDate),
  amount: payload.amount !== undefined ? `Rs. ${payload.amount}` : "-",
  status: normalizePaymentStatus(payload.bookingPayment),
  bookingStatus: normalizeBookingStatus(payload.status),
  paymentMethod: payload.paymentMethod,
});

const mapIncomingToStored = (
  payload: IncomingBookingEvent
): StoredNotificationShape => ({
  bookingId: payload.bookingId,
  userId: payload.userId,
  userName: payload.userName || payload.name || payload.email,
  email: payload.email,
  roomNumber: payload.roomNumber,
  checkInDate: payload.checkInDate,
  checkOutDate: payload.checkOutDate,
  stayDurationNights: payload.stayDurationNights,
  amount: payload.amount,
  paymentMethod: payload.paymentMethod,
  bookingPayment: payload.bookingPayment,
  status: payload.status,
  createdAt: new Date().toISOString(),
});

const persistToStorage = (data: unknown[]) => {
  try {
    localStorage.setItem(
      BOOKING_HISTORY_STORAGE_KEY,
      JSON.stringify(data.slice(0, MAX_BOOKINGS))
    );
  } catch {
    /* ignore storage errors */
  }
};

const loadFromStorage = (): StoredNotificationShape[] => {
  try {
    const raw = localStorage.getItem(BOOKING_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};


export type UseBookingsReturn = {
  bookings: Booking[];
  newBookingIds: string[];
  hotelName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export const useBookings = (hotelId: string | null): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newBookingIds, setNewBookingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotelName, setName] = useState<string | null>(null);


  const fetchBookings = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getBookingHistory(hotelId);
      const history: HotelBookingHistoryEntry[] =
        response.data?.data?.bookingHistory ||
        response.data?.bookingHistory ||
        [];

      // console.log(response.data?.data?.bookingHistory)

      if (!Array.isArray(history)) {
        setBookings([]);
        return;
      }

      persistToStorage(history);

      setBookings(
        deduplicateById(history.map(mapHistoryBooking)).slice(0, MAX_BOOKINGS)
      );
      setName(response.data?.data?.hotelName)
    } catch {
      setError("Failed to fetch bookings.");

      const cached = loadFromStorage();
      if (cached.length > 0) {
        setBookings(
          deduplicateById(
            cached.map((item) => mapIncomingBooking(item as IncomingBookingEvent))
          ).slice(0, MAX_BOOKINGS)
        );
      }
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);


  useEffect(() => {
    if (!hotelId) return;
    console.log("Connecting to socket for hotelId:", hotelId);

    const socket: Socket = io(SOCKET_BASE_URL, {
      path: "/api/v1/admin/socket.io",
      query: { hotelId: hotelId },
      withCredentials: true,
      transports: ["websocket"],
    });

    const handleNewBooking = (payload: IncomingBookingEvent) => {
      const incoming = mapIncomingBooking(payload);

      const previous = loadFromStorage();
      const withoutDuplicate = payload.bookingId
        ? previous.filter((item) => item.bookingId !== payload.bookingId)
        : previous;
      persistToStorage([mapIncomingToStored(payload), ...withoutDuplicate]);

      setBookings((prev) => {
        const withoutOld = prev.filter((item) => item.id !== incoming.id);
        return [incoming, ...withoutOld].slice(0, MAX_BOOKINGS);
      });

      setNewBookingIds((prev) =>
        [incoming.id, ...prev].slice(0, 50)
      );
      setTimeout(() => {
        setNewBookingIds((prev) => prev.filter((id) => id !== incoming.id));
      }, NEW_BOOKING_HIGHLIGHT_MS);
    };

    socket.on("new_booking", handleNewBooking);
    socket.on("booking_notification", handleNewBooking);
    socket.on("bookingConfirmed", handleNewBooking);

    return () => {
      socket.off("new_booking", handleNewBooking);
      socket.off("booking_notification", handleNewBooking);
      socket.off("bookingConfirmed", handleNewBooking);
      socket.disconnect();
    };
  }, [hotelId]);

  return { bookings, hotelName, newBookingIds, loading, error, refetch: fetchBookings };
};