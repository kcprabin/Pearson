import { useEffect, useState, useCallback } from "react";
import { getRooms } from "../Services/hotel.api";
import { useAuth } from "../Contexts/Authcontext";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type RoomType   = "DELUXE" | "SUITE" | "STANDARD";

export interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  suitetype: string;
  pricePerNight: number;
  basePrice: number;
  capacity: number;
  maxOccupancy: number;
  floorNumber: number;
  bedType: string;
  viewType: string;
  roomImages: string[];
  roomDescription: string;
  amenities: string[];
  status: RoomStatus;
  rating: number;
  discount: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface Pagination {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

export const useRooms = () => {
  const [rooms, setRooms]           = useState<Room[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const auth    = useAuth();
  const hotelId = auth?.hotelId;

  const fetchRooms = useCallback(async () => {
     if (!hotelId) {
    return;
  }
    try {
      setLoading(true);
      setError("");

      const data = await getRooms(hotelId, page);
      console.log(data)
      setRooms(data.data?.rooms??[]);
      setPagination(data.data?.pagination ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [hotelId, page]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    pagination,
    page,
    setPage,
    loading,
    error,
    refetch: fetchRooms,
  };
};