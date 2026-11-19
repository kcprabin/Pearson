export interface HotelAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'hotelAdmin';
  hotelId: string;
  createdAt: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  totalRooms: number;
  image?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  price: number;
  bedType: string;
  amenities: string[];
  images: string[];
  status: 'available' | 'booked' | 'maintenance';
  description?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  hotelId: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface Review {
  id: string;
  hotelId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Earning {
  id: string;
  hotelId: string;
  bookingId: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed';
}

export interface ChatMessage {
  id: string;
  hotelId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}


type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
type RoomType = "STANDARD" | "DELUXE" | "SUITE";

export interface AddRoomFormData {
  roomNumber: string;
  roomType: RoomType;
  suitetype: string;
  pricePerNight: number | "";
  capacity: number | "";
  floorNumber: number | "";
  status: RoomStatus;
  amenities: string[];
  discount: number | "";
  roomImages: File[];
  description: string;
}