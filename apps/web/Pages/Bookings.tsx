import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../Contexts/Authcontext";
import { useBookings } from "../Hooks/useBooking";
import { useRooms } from "../Hooks/useRooms";
import { getHotelById } from "../Services/hotel.api"; // ← adjust path if needed
import BookingDetails from "../Components/modal-popups/BookingDetailModal";
import CreateBookingModal from "../Components/modal-popups/AddBookingModal";

type Status = "ALL" | "PAID" | "NOTPAID";
type BookingStatus = "ALL" | "CONFIRMED" | "PENDING" | "CANCELLED";

const paymentStatusMap: Record<string, string> = {
  PAID:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOTPAID: "bg-amber-50 text-amber-700 border-amber-200",
};

const bookingStatusMap: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const Bookings = () => {
  const auth    = useAuth();
  const hotelId = auth?.hotelId || null;

  const { bookings, newBookingIds, loading, error, refetch } = useBookings(hotelId);
  const { rooms } = useRooms(); 

  // ── Hotel name ─────────────────────────────────────────────────────────────
  const [hotelName, setHotelName] = useState("");

  useEffect(() => {
    if (!hotelId) return;
    const fetchHotel = async () => {
      try {
        const res = await getHotelById(hotelId);
        const hotel = res?.data ?? res;
        setHotelName(hotel?.hotelName ?? hotel?.name ?? "");
      } catch {
        // non-critical — modal header just shows empty string
      }
    };
    fetchHotel();
  }, [hotelId]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal]         = useState(false);
  const [selectedBookingId, setSelectedBookingId]     = useState<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [payFilter, setPayFilter]       = useState<Status>("ALL");
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("ALL");
  const [search, setSearch]             = useState("");

  // ── Derived state ──────────────────────────────────────────────────────────
  const filtered = bookings.filter(
    (b) =>
      (payFilter === "ALL" || b.status === payFilter) &&
      (statusFilter === "ALL" || b.bookingStatus === statusFilter) &&
      (
        b.guest.toLowerCase().includes(search.toLowerCase()) ||
        b.room.includes(search) ||
        b.id.toLowerCase().includes(search.toLowerCase())
      )
  );

  const confirmedCount = bookings.filter((b) => b.bookingStatus === "CONFIRMED").length;
  const pendingCount   = bookings.filter((b) => b.bookingStatus === "PENDING").length;
  const unpaidCount    = bookings.filter((b) => b.status === "NOTPAID").length;
  const cancelledCount = bookings.filter((b) => b.bookingStatus === "CANCELLED").length;

  const summaryCards = [
    { label: "Confirmed", value: confirmedCount, sub: "Active reservations",  color: "text-blue-600"  },
    { label: "Pending",   value: pendingCount,   sub: "Awaiting confirmation", color: "text-amber-600" },
    { label: "Unpaid",    value: unpaidCount,    sub: "Payment not received",  color: "text-red-500"   },
    { label: "Cancelled", value: cancelledCount, sub: "Cancelled bookings",    color: "text-slate-400" },
  ];

  // Map useRooms shape → CreateBookingModal's Room type
  // (roomType → type; everything else already matches)
  const modalRooms = rooms.map((r) => ({
    _id:          r._id,
    roomNumber:   r.roomNumber,
    pricePerNight: r.pricePerNight,
    type:         r.roomType, // ← renamed field
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Bookings</h1>
          <p className="text-xs text-slate-500">Manage all reservations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          + New Booking
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span>{error}</span>
          <button onClick={refetch} className="ml-4 text-xs underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition hover:-translate-y-1 duration-200 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search guest, room, booking ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500 transition"
        />
        <div className="flex gap-2">
          {(["ALL", "PAID", "NOTPAID"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setPayFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                payFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "NOTPAID" ? "Unpaid" : s === "ALL" ? "All Payment" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["ALL", "CONFIRMED", "PENDING", "CANCELLED"] as BookingStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "ALL" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">All Bookings</h2>
            <p className="text-xs text-slate-500">Every booking currently in the system</p>
          </div>
          <span className="text-xs text-slate-500">{filtered.length} shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: "fixed", minWidth: "900px" }}>
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ width: "130px" }}>Booking ID</th>
                <th className="text-left px-4 py-3 font-medium" style={{ width: "180px" }}>Guest</th>
                <th className="text-center px-4 py-3 font-medium" style={{ width: "80px" }}>Room</th>
                <th className="text-center px-4 py-3 font-medium" style={{ width: "90px" }}>Payment</th>
                <th className="text-center px-4 py-3 font-medium" style={{ width: "100px" }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ width: "90px" }}>Check-in</th>
                <th className="text-left px-4 py-3 font-medium" style={{ width: "90px" }}>Check-out</th>
                <th className="text-right px-4 py-3 font-medium" style={{ width: "100px" }}>Amount</th>
                <th className="text-left px-4 py-3 font-medium" style={{ width: "80px" }}>Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={9}>
                    Loading bookings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={9}>
                    No bookings available.
                  </td>
                </tr>
              ) : (
                filtered.map((b, i) => (
                  <motion.tr
                    key={b.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedBookingId(b.id)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="px-4 py-3 align-middle font-mono text-xs text-slate-400 truncate">{b.id}</td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-800 truncate">{b.guest}</span>
                          <span className="text-[11px] text-slate-400 truncate">{b.email || "-"}</span>
                        </div>
                        {newBookingIds.includes(b.id) && (
                          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <span className="text-blue-600 font-medium">{b.room}</span>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${paymentStatusMap[b.status]}`}>
                        {b.status === "PAID" ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${bookingStatusMap[b.bookingStatus]}`}>
                        {b.bookingStatus.charAt(0) + b.bookingStatus.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs align-middle">{b.checkIn}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs align-middle">{b.checkOut}</td>
                    <td className="px-4 py-3 text-right align-middle text-blue-600 font-medium text-xs">{b.amount}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs align-middle">{b.paymentMethod || "-"}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BOOKING MODAL */}
      <CreateBookingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        hotelId={hotelId ?? ""}
        hotelName={hotelName}
        rooms={modalRooms}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />

      {/* BOOKING DETAILS MODAL */}
      <AnimatePresence>
        {selectedBookingId && (
          <BookingDetails
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bookings;