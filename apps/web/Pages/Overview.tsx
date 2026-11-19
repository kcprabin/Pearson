import { useState, useMemo, useEffect } from "react";
import { StatCard } from "../Components/Statcard";
import {
  FaBed,
  FaCalendarCheck,
  FaCheckCircle,
} from "react-icons/fa";
import { useRooms } from "../Hooks/useRooms";
import { useBookings } from "../Hooks/useBooking";
import { useAuth } from "../Contexts/Authcontext";
import { getTotalIncome } from "../Services/booking.api";

const Overview = () => {
  const [floor, setFloor] = useState("all");

  const auth    = useAuth();
  const hotelId = auth?.hotelId ?? null;

  const { rooms, loading: roomsLoading }       = useRooms();
  const { bookings, loading: bookingsLoading } = useBookings(hotelId);

  const [totalIncome,   setTotalIncome]   = useState(0);
  const [incomeLoading, setIncomeLoading] = useState(false);

  useEffect(() => {
    if (!hotelId) return;

    const fetchIncome = async () => {
      setIncomeLoading(true);
      try {
        const incomeRes = await getTotalIncome(hotelId);
        setTotalIncome(incomeRes.data.data.totalIncome ?? 0);
      } catch {
        // leave as 0 on error
      } finally {
        setIncomeLoading(false);
      }
    };

    void fetchIncome();
  }, [hotelId]);

  const loading = roomsLoading || bookingsLoading || incomeLoading;

  const occupiedRooms = useMemo(
    () => rooms.filter((r) => r.status === "OCCUPIED").length,
    [rooms]
  );

  const averageRating = useMemo(() => {
    const rated = rooms.filter((r) => r.rating > 0);
    if (!rated.length) return 0;
    return rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
  }, [rooms]);

  const todayCheckins = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    return bookings.filter((b) => b.checkIn === today);
  }, [bookings]);

  const stats = [
    {
      title: "Total Revenue",
      value: `Rs. ${totalIncome.toLocaleString()}`,
      icon: <span className="font-semibold text-sm">Rs</span>,
    },
    {
      title: "Rooms Occupied",
      value: `${occupiedRooms} / ${rooms.length}`,
      icon: <FaBed />,
    },
    {
      title: "Average Rating",
      value: averageRating ? `${averageRating.toFixed(1)} / 5` : "0 / 5",
      icon: <FaCheckCircle />,
    },
    {
      title: "Today's Check-ins",
      value: String(todayCheckins.length),
      icon: <FaCalendarCheck />,
    },
  ];

  const floors = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      if (r.floorNumber !== undefined && r.floorNumber !== null)
        set.add(String(r.floorNumber));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [rooms]);

  const filteredRooms =
    floor === "all"
      ? rooms
      : rooms.filter((r) => String(r.floorNumber) === floor);

  const statusMap: Record<string, string> = {
    OCCUPIED:    "bg-blue-50 text-blue-600 border-blue-100",
    AVAILABLE:   "bg-emerald-50 text-emerald-600 border-emerald-100",
    MAINTENANCE: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      <div>
        <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
        <p className="text-xs text-slate-500">Hotel operations summary</p>
      </div>

      {loading ? (
        <div className="text-center py-4 text-sm text-slate-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <div key={i} className="transition hover:-translate-y-1 duration-200">
                <StatCard title={s.title} value={s.value} icon={s.icon} />
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid lg:grid-cols-3 gap-5">

            {/* ROOM TABLE */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700">Room Overview</h3>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1
                    bg-white text-slate-600 focus:outline-none focus:ring-1
                    focus:ring-blue-500 hover:border-blue-300 transition"
                >
                  <option value="all">All Floors</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>Floor {f}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-400">
                    <tr>
                      <th className="text-left py-3 px-3 font-medium">Room No.</th>
                      <th className="text-left font-medium">Type</th>
                      <th className="text-left font-medium">Floor</th>
                      <th className="text-left font-medium">Price/Night</th>
                      <th className="text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRooms.length > 0 ? (
                      filteredRooms.map((r, i) => (
                        <tr key={i} className="transition hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="font-semibold text-blue-600">
                                {r.roomNumber}
                              </span>
                            </div>
                          </td>
                          <td className="text-slate-600">{r.roomType}</td>
                          <td className="text-slate-600">Floor {r.floorNumber}</td>
                          <td className="text-slate-600">Rs. {r.pricePerNight}</td>
                          <td>
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border ${
                                statusMap[r.status] ?? "bg-gray-50 text-gray-600 border-gray-100"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No rooms found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TODAY'S CHECK-INS */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
              <h3 className="text-sm font-medium text-slate-700 mb-4">
                Today's Check-ins ({todayCheckins.length})
              </h3>
              <div className="space-y-3">
                {todayCheckins.length > 0 ? (
                  todayCheckins.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{b.guest}</p>
                        <p className="text-xs text-slate-500">Room {b.room}</p>
                      </div>
                      <span className="text-xs text-blue-600">{b.checkIn}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No check-ins today
                  </p>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Overview;