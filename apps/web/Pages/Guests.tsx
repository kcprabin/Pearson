import { useState } from "react";
import { motion } from "framer-motion";
import { useGuestStatus, type Booking,type  GuestStayStatus } from "../Hooks/useGuestStatus";


type Filter = "ALL" | GuestStayStatus | "PAID" | "NOTPAID";


const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const normaliseStatus = (status: GuestStayStatus) => {
  if (status === "CHECKED IN")  return "CHECKED_IN";
  if (status === "CHECKED OUT") return "CHECKED_OUT";
  return status;
};


const stayStyleMap: Record<string, string> = {
  CHECKED_IN:  "bg-emerald-50 text-emerald-600 border-emerald-100",
  CHECKED_OUT: "bg-rose-50    text-rose-600    border-rose-100",
  UPCOMING:    "bg-blue-50    text-blue-600    border-blue-100",
};

const paymentStyleMap: Record<string, string> = {
  PAID:    "bg-emerald-50 text-emerald-600 border-emerald-100",
  NOTPAID: "bg-rose-50    text-rose-600    border-rose-100",
};


const CardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
    <div className="h-3 w-1/2 bg-slate-200 rounded" />
    <div className="h-2 w-1/3 bg-slate-100 rounded" />
    <div className="h-px bg-slate-100 my-2" />
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex justify-between">
        <div className="h-2 w-16 bg-slate-100 rounded" />
        <div className="h-2 w-20 bg-slate-200 rounded" />
      </div>
    ))}
  </div>
);


const GuestCard = ({ b }: { b: Booking }) => {
  const normStatus = normaliseStatus(b.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-5 transition duration-200 hover:shadow-md hover:-translate-y-1"
    >
      {/* TOP */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {b.bookingName ?? "N/A"}
          </h3>
          <p className="text-xs text-slate-500">
            Room {b.bookingRoomNumber ?? "N/A"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {b.bookingTotalNights} night{b.bookingTotalNights !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-col gap-1 items-end">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stayStyleMap[normStatus] ?? stayStyleMap.UNKNOWN}`}>
            {b.status}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${paymentStyleMap[b.bookingPayment] ?? ""}`}>
            {b.bookingPayment === "NOTPAID" ? "Not Paid" : "Paid"}
          </span>
        </div>
      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-2 gap-y-3 text-xs">
        <div className="text-slate-500">Check-in</div>
        <div className="text-right text-slate-800 font-medium">
          {formatDate(b.bookingCheckIn)}
        </div>

        <div className="text-slate-500">Check-out</div>
        <div className="text-right text-slate-800 font-medium">
          {formatDate(b.bookingCheckOut)}
        </div>

        <div className="text-slate-500">Payment</div>
        <div className="text-right text-slate-500">{b.bookingPaymentMethod}</div>

        <div className="text-slate-500">Total</div>
        <div className="text-right text-slate-900 font-semibold">
          Rs. {b.totalMoneySpent?.toLocaleString() ?? "0"}
        </div>
      </div>
    </motion.div>
  );
};


const Guests = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const { bookings, loading, error, refetch } = useGuestStatus();

  const filtered = bookings.filter((b) => {
    const matchSearch =
      (b.bookingName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.bookingRoomNumber ?? "").toLowerCase().includes(search.toLowerCase());

    const normStatus = normaliseStatus(b.status);
    const matchFilter =
      filter === "ALL" ||
      filter === b.status ||
      filter === normStatus ||
      filter === b.bookingPayment;

    return matchSearch && matchFilter;
  });

  const filters: Filter[] = ["ALL", "CHECKED IN", "CHECKED OUT", "UPCOMING", "PAID", "NOTPAID"];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Guests</h1>
          <p className="text-xs text-slate-500">Guest profiles and stay details</p>
        </div>
        <button onClick={refetch} className="text-xs text-blue-600 hover:underline">
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search guest or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
          : filtered.length === 0
          ? (
            <div className="col-span-full text-center py-16 text-slate-400 text-sm">
              {bookings.length === 0 ? "No bookings found for this hotel." : "No guests match your search."}
            </div>
          )
          : filtered.map((b, i) => <GuestCard key={i} b={b} />)
        }
      </div>
    </div>
  );
};

export default Guests;