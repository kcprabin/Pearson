import { useEffect, useState } from "react";
import { useAuth } from "../../Contexts/Authcontext";
import { motion } from "framer-motion";
import { useBookings } from "../../Hooks/useBooking";
import { getBookingHistory } from "../../Services/hotel.api";
import { updateBooking,type updateBookingPayload } from "../../Services/booking.api";
import { Toast } from "../modal-popups/Toast";
import { useToast } from "../../Hooks/useToast";

type StoredBookingEvent = {
  bookingId?: string;
  userId?: string;
  guestName?: string;
  userName?: string;
  name?: string;
  email?: string;
  hotelId?: string;
  hotelName?: string;
  roomId?: string;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkinDate?: string;
  checkoutDate?: string;
  stayDurationNights?: number;
  amount?: number | string;
  totalPrice?: number;
  paymentMethod?: string;
  bookingPayment?: string;
  status?: string;
  createdAt?: string;
};

type HotelBookingHistoryEntry = {
  bookingId?: string;
  userId?: string;
  guestName?: string;
  roomNumber?: string;
  checkinDate?: string;
  checkoutDate?: string;
  stayDurationNights?: number;
  totalPrice?: number;
  paymentMethod?: string;
  bookingPayment?: string;
  status?: string;
  email?: string;
  hotelId?: string;
  hotelName?: string;
  createdAt?: string;
};

type Props = {
  bookingId: string;
  onClose: () => void;
};

const BOOKING_HISTORY_STORAGE_KEY = "recentBookingHistory";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const paymentBadge: Record<string, string> = {
  PAID:    "bg-green-50 text-green-800 border border-green-200",
  NOTPAID: "bg-red-50 text-red-800 border border-red-200",
};

const statusBadge: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-800 border border-blue-200",
  PENDING:   "bg-amber-50 text-amber-800 border border-amber-200",
  CANCELLED: "bg-red-50 text-red-800 border border-red-200",
};

const selectClass =
  "text-[11px] px-2 py-0.5 rounded-full font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400";

const Field = ({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="bg-slate-50 rounded-lg p-3">
    <p className="text-[11px] text-slate-500 mb-1 flex items-center gap-1">
      <i className={`ti ${icon} text-xs`} aria-hidden="true" />
      {label}
    </p>
    <p className={`text-sm font-medium text-slate-800 truncate ${mono ? "font-mono text-xs" : ""}`}>
      {value}
    </p>
  </div>
);

const BookingDetails = ({ bookingId, onClose }: Props) => {
  const auth = useAuth();
  const hotelId = auth?.hotelId || null;

  const { hotelName } = useBookings(hotelId);

  const [booking, setBooking] = useState<StoredBookingEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editBookingStatus, setEditBookingStatus] = useState<"CONFIRMED" | "PENDING" | "CANCELLED">("PENDING");
  const [editPaymentStatus, setEditPaymentStatus] = useState<"PAID" | "NOTPAID">("NOTPAID");
  const [saving, setSaving] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const loadBooking = async () => {
      if (!hotelId || !bookingId) return;
      setLoading(true);

      try {
        const response = await getBookingHistory(hotelId);
        const history =
          response.data?.data?.bookingHistory ||
          response.data?.bookingHistory ||
          [];

        if (Array.isArray(history)) {
          const matched =
            history.find(
              (item: HotelBookingHistoryEntry) => item.bookingId === bookingId
            ) || null;
          setBooking(matched);

          try {
            localStorage.setItem(
              BOOKING_HISTORY_STORAGE_KEY,
              JSON.stringify(
                history.map((item: HotelBookingHistoryEntry) => ({
                  bookingId: item.bookingId,
                  userId: item.userId,
                  guestName: item.guestName,
                  email: item.email,
                  hotelId: item.hotelId,
                  hotelName: hotelName,
                  roomNumber: item.roomNumber,
                  checkInDate: item.checkinDate,
                  checkOutDate: item.checkoutDate,
                  stayDurationNights: item.stayDurationNights,
                  amount: item.totalPrice,
                  paymentMethod: item.paymentMethod,
                  bookingPayment: item.bookingPayment,
                  status: item.status,
                  createdAt: item.createdAt,
                })).slice(0, 30)
              )
            );
          } catch { /* ignore */ }
        }
      } catch {
        try {
          const raw = localStorage.getItem(BOOKING_HISTORY_STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return;
          setBooking(
            parsed.find((item: StoredBookingEvent) => item.bookingId === bookingId) || null
          );
        } catch {
          setBooking(null);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadBooking();
  }, [bookingId, hotelId, hotelName]);

  // Keep edit fields in sync whenever the booking (re)loads
  useEffect(() => {
    if (booking) {
      setEditBookingStatus(
        (booking.status as "CONFIRMED" | "PENDING" | "CANCELLED") || "PENDING"
      );
      setEditPaymentStatus(booking.bookingPayment === "PAID" ? "PAID" : "NOTPAID");
    }
  }, [booking]);

  const displayName =
    booking?.guestName || booking?.userName || booking?.name || "Guest";

  const nights      = booking?.stayDurationNights || 1;
  const checkIn     = booking?.checkinDate  || booking?.checkInDate;
  const checkOut    = booking?.checkoutDate || booking?.checkOutDate;
  const amount      = booking?.totalPrice   ?? booking?.amount;
  const payStatus   = booking?.bookingPayment || "NOTPAID";
  const bookStatus  = booking?.status        || "PENDING";

  const startEditing = () => {
    clearToast();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditBookingStatus((booking?.status as "CONFIRMED" | "PENDING" | "CANCELLED") || "PENDING");
    setEditPaymentStatus(booking?.bookingPayment === "PAID" ? "PAID" : "NOTPAID");
    clearToast();
  };

  const handleSave = async () => {
    if (!booking?.bookingId) return;
    setSaving(true);
    clearToast();

    try {
      const payload={
         status: editBookingStatus,
        bookingPayment: editPaymentStatus,
      } as updateBookingPayload;

      await updateBooking(booking.bookingId, payload as any);

      setBooking({
        ...booking,
        status: editBookingStatus,
        bookingPayment: editPaymentStatus,
      });
      showToast("success", "Booking updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || err?.message || "Failed to update booking."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Toast toast={toast} />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-sm font-medium text-blue-700 shrink-0">
            {loading ? "..." : getInitials(displayName)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {loading ? "Loading..." : displayName}
            </p>
            {!loading && booking && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {isEditing ? (
                  <select
                    value={editBookingStatus}
                    onChange={(e) =>
                      setEditBookingStatus(e.target.value as "CONFIRMED" | "PENDING" | "CANCELLED")
                    }
                    className={selectClass}
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                ) : (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadge[bookStatus] ?? statusBadge.PENDING}`}>
                    {bookStatus.charAt(0) + bookStatus.slice(1).toLowerCase()}
                  </span>
                )}

                {isEditing ? (
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as "PAID" | "NOTPAID")}
                    className={selectClass}
                  >
                    <option value="PAID">Paid</option>
                    <option value="NOTPAID">Unpaid</option>
                  </select>
                ) : (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${paymentBadge[payStatus] ?? paymentBadge.NOTPAID}`}>
                    {payStatus === "PAID" ? "Paid" : "Unpaid"}
                  </span>
                )}
              </div>
            )}
          </div>

          {!loading && booking && !isEditing && (
            <button
              onClick={startEditing}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition shrink-0"
              aria-label="Edit booking"
            >
              Edit
            </button>
          )}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Loading booking details...
          </div>
        ) : !booking ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            No booking details found for this entry.
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">

            {/* Stay bar */}
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mb-2">
                Stay details
              </p>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                    <i className="ti ti-calendar text-xs" aria-hidden="true" />
                    Check-in
                  </p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(checkIn)}</p>
                </div>

                <div className="text-center">
                  <i className="ti ti-arrow-right text-slate-300 text-base" aria-hidden="true" />
                  <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                    {nights} night{nights !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex-1 text-right">
                  <p className="text-[11px] text-slate-400 mb-0.5 flex items-center justify-end gap-1">
                    <i className="ti ti-calendar text-xs" aria-hidden="true" />
                    Check-out
                  </p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>

            {/* Fields grid */}
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mb-2">
                Booking info
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Field icon="ti-hash"        label="Booking ID"     value={booking.bookingId    || "-"} mono />
                <Field icon="ti-door"        label="Room"           value={booking.roomNumber   || booking.roomId || "-"} />
                <Field icon="ti-mail"        label="Email"          value={booking.email        || "-"} />
                <Field icon="ti-credit-card" label="Payment method" value={booking.paymentMethod || "-"} />
                <Field icon="ti-building"    label="Hotel"          value={hotelName || "-"} />
                <Field icon="ti-clock"       label="Received at"    value={formatDateTime(booking.createdAt)} />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">Total amount</p>
              <p className="text-xl font-medium text-slate-900">
                Rs. {amount ?? "-"}
              </p>
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          {isEditing ? (
            <>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5"
              >
                <i className="ti ti-printer text-sm" aria-hidden="true" />
                Print receipt
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BookingDetails;