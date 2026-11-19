import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CalendarDays,
  Users,
  CreditCard,
  BedDouble,
  ChevronDown,
  Building2,
  Check,
} from "lucide-react";
import { Toast } from "../modal-popups/Toast"; 
import { useToast } from "../../Hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Room {
  _id: string;
  roomNumber: string;
  pricePerNight: number;
  type?: string;
}

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
  rooms: Room[];
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Primitive UI pieces ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 mb-2.5">
      {children}
    </p>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] font-medium text-slate-500 mb-1">
      {children}
    </label>
  );
}

function Input({
  icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`
          w-full rounded-lg text-[13px] text-slate-800 placeholder-slate-400
          bg-slate-50 border focus:outline-none focus:ring-2 focus:ring-blue-500/20
          focus:border-blue-400 focus:bg-white transition-all duration-150
          ${icon ? "pl-[30px] pr-3 py-2" : "px-3 py-2"}
          ${error ? "border-red-300 bg-red-50/50" : "border-slate-200"}
        `}
      />
    </div>
  );
}

function Select({
  icon,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <select
        {...props}
        className={`
          w-full appearance-none rounded-lg text-[13px] text-slate-800
          bg-slate-50 border focus:outline-none focus:ring-2 focus:ring-blue-500/20
          focus:border-blue-400 focus:bg-white transition-all duration-150
          ${icon ? "pl-[30px] pr-7 py-2" : "px-3 pr-7 py-2"}
          ${error ? "border-red-300 bg-red-50/50" : "border-slate-200"}
        `}
      >
        {children}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1 text-[11px] text-red-500"
    >
      {msg}
    </motion.p>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 my-4" />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function CreateBookingModal({
  isOpen,
  onClose,
  hotelId,
  hotelName,
  rooms,
  onSuccess,
}: CreateBookingModalProps) {
  const [guestName, setGuestName]         = useState("");
  const [guestEmail, setGuestEmail]       = useState("");
  const [roomId, setRoomId]               = useState("");
  const [checkIn, setCheckIn]             = useState("");
  const [checkOut, setCheckOut]           = useState("");
  const [guests, setGuests]               = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "KHALTI" | "ESEWA">("COD");
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [submitting, setSubmitting]       = useState(false);

  const { toast, showToast, clearToast } = useToast();

  const selectedRoom = rooms.find((r) => r._id === roomId);
  const nights       = calcNights(checkIn, checkOut);
  const totalPrice   = selectedRoom ? selectedRoom.pricePerNight * nights : 0;

  useEffect(() => {
    if (isOpen) {
      setGuestName(""); setGuestEmail(""); setRoomId("");
      setCheckIn(""); setCheckOut(""); setGuests(1);
      setPaymentMethod("COD"); setErrors({}); clearToast();
    }
  }, [isOpen]);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!guestName.trim())  e.guestName  = "Guest name is required";
    if (!guestEmail.trim()) e.guestEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))
      e.guestEmail = "Enter a valid email";
    if (!roomId)   e.roomId   = "Select a room";
    if (!checkIn)  e.checkIn  = "Check-in date is required";
    if (!checkOut) e.checkOut = "Check-out date is required";
    if (checkIn && checkOut && checkOut <= checkIn)
      e.checkOut = "Check-out must be after check-in";
    if (guests < 1) e.guests = "At least 1 guest required";
    return e;
  }, [guestName, guestEmail, roomId, checkIn, checkOut, guests]);

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    clearToast();
    setSubmitting(true);

    try {
      const { createBooking } = await import("../../Services/booking.api");
      await createBooking({
        roomId,
        hotelId,
        hotelName,
        roomNumber: selectedRoom!.roomNumber,
        checkIn:new Date(checkIn).toISOString(),
        checkOut:new Date(checkOut).toISOString(),
        guests,
        totalPrice,
        paymentMethod,
        Name:guestName,
        email:guestEmail,
      });
      showToast("success", "Booking confirmed successfully!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || err?.message || "Booking failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 flex flex-col"
            >
              {/* ── Toast — sits at top of panel, same pattern as AddRoomModal ── */}
              <Toast toast={toast} />

              {/* ── Header ── */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-1 mb-2">
                    <Building2 size={11} />
                    <span>{hotelName}</span>
                  </div>
                  <h2 className="text-[15px] font-medium text-slate-900 leading-snug">
                    New booking
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="mt-0.5 p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* ── Body ── */}
              <div className="px-6 py-5 flex-1">

                {/* Section: Guest information */}
                <SectionLabel>Guest information</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <FieldLabel htmlFor="guestName">Full name</FieldLabel>
                    <Input
                      id="guestName"
                      placeholder="E.g.Ram"
                      value={guestName}
                      error={!!errors.guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                    <FieldError msg={errors.guestName} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="guestEmail">Email</FieldLabel>
                    <Input
                      id="guestEmail"
                      type="email"
                      placeholder="guest@email.com"
                      value={guestEmail}
                      error={!!errors.guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <FieldError msg={errors.guestEmail} />
                  </div>
                </div>

                <Divider />

                {/* Section: Room & dates */}
                <SectionLabel>Room &amp; dates</SectionLabel>
                <div className="space-y-2.5">
                  <div>
                    <FieldLabel htmlFor="roomId">Room</FieldLabel>
                    <Select
                      id="roomId"
                      icon={<BedDouble size={14} />}
                      value={roomId}
                      error={!!errors.roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                    >
                      <option value="" disabled>Select a room</option>
                      {rooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          Room {r.roomNumber}
                          {r.type ? ` · ${r.type}` : ""}
                          {" · "}Rs.{r.pricePerNight}/night
                        </option>
                      ))}
                    </Select>
                    <FieldError msg={errors.roomId} />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <FieldLabel htmlFor="checkIn">Check-in</FieldLabel>
                      <Input
                        id="checkIn"
                        type="date"
                        icon={<CalendarDays size={14} />}
                        min={today}
                        value={checkIn}
                        error={!!errors.checkIn}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (checkOut && checkOut <= e.target.value) setCheckOut("");
                        }}
                      />
                      <FieldError msg={errors.checkIn} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="checkOut">Check-out</FieldLabel>
                      <Input
                        id="checkOut"
                        type="date"
                        icon={<CalendarDays size={14} />}
                        min={checkIn || today}
                        value={checkOut}
                        error={!!errors.checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                      <FieldError msg={errors.checkOut} />
                    </div>
                  </div>
                </div>

                {/* Price summary */}
                <AnimatePresence>
                  {selectedRoom && nights > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3.5 py-2.5 flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium text-blue-600">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Rs.{selectedRoom.pricePerNight}/night × {nights}
                          </span>
                        </div>
                        <span className="text-[17px] font-medium text-blue-600">
                          Rs.{totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Divider />

                {/* Section: Stay details */}
                <SectionLabel>Stay details</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <FieldLabel htmlFor="guests">Guests</FieldLabel>
                    <Input
                      id="guests"
                      type="number"
                      icon={<Users size={14} />}
                      min={1}
                      max={20}
                      value={guests}
                      error={!!errors.guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    />
                    <FieldError msg={errors.guests} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="paymentMethod">Payment</FieldLabel>
                    <Select
                      id="paymentMethod"
                      icon={<CreditCard size={14} />}
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as "COD" | "ESEWA" | "KHALTI")
                      }
                    >
                      <option value="COD">Cash on delivery</option>
                      <option value="KHALTI">Khalti</option>
                      <option value="ESEWA">eSewa</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="px-6 pb-5 pt-3 flex items-center gap-2.5 border-t border-slate-100">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Confirming…
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Confirm booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}