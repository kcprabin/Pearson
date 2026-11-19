import { useState } from "react";
import { motion } from "framer-motion";
import { getTotalIncome, getPendingIncome } from "../Services/booking.api";
import { useAuth } from "../Contexts/Authcontext";
import { useBookings } from "../Hooks/useBooking";
import { useEffect, useCallback } from "react";

type Status = "SUCCESS" | "PENDING" | "CANCELLED";

const statusMap: Record<Status, string> = {
  SUCCESS:   "bg-emerald-50 text-emerald-600 border-emerald-100",
  PENDING:   "bg-amber-50  text-amber-600  border-amber-100",
  CANCELLED: "bg-rose-50   text-rose-600   border-rose-100",
};

const getTxnStatus = (b: { status: string; bookingStatus: string }): Status => {
  if (b.bookingStatus === "CANCELLED") return "CANCELLED";
  if (b.status === "PAID") return "SUCCESS";
  return "PENDING";
};

const Finance = () => {
  const auth    = useAuth();
  const hotelId = auth?.hotelId || null;

  const { bookings, loading, error, refetch } = useBookings(hotelId);

  const [totalIncome,   setTotalIncome]   = useState<number>(0);
  const [pendingIncome, setPendingIncome] = useState<number>(0);
  const [incomeLoading, setIncomeLoading] = useState(true);
  const [incomeError,   setIncomeError]   = useState("");

  const [filter,   setFilter]   = useState<"ALL" | Status>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const fetchIncome = useCallback(async () => {
    if (!hotelId) return;
    try {
      setIncomeLoading(true);
      setIncomeError("");
      const [incomeRes, pendingRes] = await Promise.all([
        getTotalIncome(hotelId),
        getPendingIncome(hotelId),
      ]);
      setTotalIncome(incomeRes.data.data.totalIncome ?? 0);
      setPendingIncome(pendingRes.data.data.totalPendingIncome ?? 0);
    } catch (err: unknown) {
      setIncomeError(err instanceof Error ? err.message : "Failed to load income data");
    } finally {
      setIncomeLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);


  const inDateRange = (dateStr: string) => {
    if (!fromDate && !toDate) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate)) return false;
    return true;
  };

  const filtered = bookings.filter((b) => {
    const txnStatus   = getTxnStatus(b);
    const matchStatus = filter === "ALL" || txnStatus === filter;
    return matchStatus && inDateRange(b.checkIn);
  });


  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Finance</h1>
          <p className="text-xs text-slate-500">Income and transaction records</p>
        </div>
        <button
          onClick={() => { fetchIncome(); refetch(); }}
          className="text-xs text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* ERRORS */}
      {(error || incomeError) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
          {error || incomeError}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300">
          <p className="text-xs text-slate-500">Total Income</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">
            {incomeLoading ? "—" : `Rs. ${totalIncome.toLocaleString()}`}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300">
          <p className="text-xs text-slate-500">Pending Income</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">
            {incomeLoading ? "—" : `Rs. ${pendingIncome.toLocaleString()}`}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300">
          <p className="text-xs text-slate-500">Transactions</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">
            {filtered.length}
          </h2>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">

        <div className="flex gap-2">
          {(["ALL", "SUCCESS", "PENDING"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />

        <span className="text-xs text-slate-400">to</span>

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        <table className="w-full text-sm table-fixed">

          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[28%]" />
          </colgroup>

          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left   px-6 py-3.5 font-medium">SN</th>
              <th className="text-right  px-6 py-3.5 font-medium">Amount</th>
              <th className="text-left   px-6 py-3.5 font-medium">Guest</th>
              <th className="text-center px-6 py-3.5 font-medium">Status</th>
              <th className="text-left   px-6 py-3.5 font-medium">Date</th>
              <th className="text-left   px-6 py-3.5 font-medium">Remark</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  Loading transactions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => {
                const txnStatus = getTxnStatus(b);
                return (
                  <motion.tr
                    key={b.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 text-slate-400 align-middle">
                      {i + 1}
                    </td>

                    <td className={`px-6 py-4 text-right font-medium whitespace-nowrap align-middle ${
                      txnStatus === "CANCELLED" ? "text-rose-600" : "text-slate-900"
                    }`}>
                      {b.amount}
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className="font-medium text-slate-800 truncate">{b.guest}</div>
                      <div className="text-[11px] text-slate-400 truncate">{b.email || "-"}</div>
                    </td>

                    <td className="px-6 py-4 text-center align-middle">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${statusMap[txnStatus]}`}>
                        {txnStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap align-middle">
                      {b.checkIn}
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs align-middle truncate">
                      Room {b.room}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default Finance;