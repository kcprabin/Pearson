import { useState } from "react";
import { motion } from "framer-motion";
import { useRooms, type Room } from "../Hooks/useRooms";
import { AddRoomModal } from "../Components/modal-popups/AddRoomModal"; 
import { createRoom } from "../Services/hotel.api";
import { useAuth } from "../Contexts/Authcontext";
import {RoomDetailModal} from "../Components/modal-popups/RoomDetailModal"

type StatusFilter = "ALL" | "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
type TypeFilter   = "ALL" | "DELUXE" | "SUITE" | "STANDARD";

const statusMap: Record<string, string> = {
  AVAILABLE:   "bg-emerald-50 text-emerald-600 border-emerald-100",
  OCCUPIED:    "bg-blue-50 text-blue-600 border-blue-100",
  MAINTENANCE: "bg-rose-50 text-rose-600 border-rose-100",
};

const Rooms = () => {
  const { rooms, pagination, page, setPage, loading, error, refetch } = useRooms();
  const auth=useAuth()
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>("ALL");
  const [search, setSearch]             = useState("");
  const [showAddRoom, setShowAddRoom]   = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const filtered = rooms.filter((room: Room) =>
    (statusFilter === "ALL" || room.status === statusFilter) &&
    (typeFilter   === "ALL" || room.roomType === typeFilter) &&
    room.roomNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (!auth || !auth.hotelId) return null;
  const hotelId = auth.hotelId;

  const handleAddRoom = async (data: any) => {
    await createRoom(hotelId, data);
    console.log("New room data:", data);
    refetch();
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Rooms</h1>
          <p className="text-xs text-slate-500">
            {pagination ? `${pagination.total} total rooms` : "Manage room inventory"}
          </p>
        </div>
        <button
          onClick={() => setShowAddRoom(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          + Add Room
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl flex justify-between items-center">
          <span>{error}</span>
          <button onClick={refetch} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search room number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
        />

        <div className="flex gap-2 flex-wrap">
          {(["ALL", "AVAILABLE", "OCCUPIED", "MAINTENANCE"] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full transition ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-white"
        >
          <option value="ALL">ALL TYPES</option>
          <option value="DELUXE">DELUXE</option>
          <option value="SUITE">SUITE</option>
          <option value="STANDARD">STANDARD</option>
        </select>
      </div>

      {/* LOADING SKELETON */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GRID */}
      {!loading && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              No rooms match your filters
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(room => (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedRoom(room)}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-1 transition"
                >
                  {/* IMAGE */}
                  <div className="relative">
                    <img
                      src={room.roomImages?.[0] ?? "/placeholder-room.jpg"}
                      alt={`Room ${room.roomNumber}`}
                      className="h-40 w-full object-cover"
                    />
                    <span className={`absolute top-3 right-3 text-[11px] px-2 py-1 rounded-full border ${statusMap[room.status]}`}>
                      {room.status}
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-blue-600">{room.roomNumber}</h3>
                        <p className="text-[11px] text-slate-400 tracking-wide">{room.roomType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          Rs. {room.pricePerNight.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-400">per night</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Capacity: {room.capacity}</span>
                      <span className="text-blue-600 font-medium">Floor {room.floorNumber}</span>
                    </div>

                    {room.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {a}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {room.discount > 0 && (
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {room.discount}% discount applied
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs text-slate-500">{room.rating.toFixed(1)}</span>
                      </div>
                      <button className="text-xs text-blue-600 hover:underline">Manage</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <RoomDetailModal
        room={selectedRoom ? { ...selectedRoom, hotelId } : null}
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />

      {/* ADD ROOM MODAL */}
      <AddRoomModal
        isOpen={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        onSubmit={handleAddRoom}
      />

    </div>
  );
};

export default Rooms;