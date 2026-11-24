export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface Order {
  id: number | string;
  username: string;
  restaurantId: number;
  restaurantName: string;
  items: string[];
  price: number;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface Feedback {
  id: number | string;
  username: string;
  restaurantId: number;
  restaurantName: string;
  feedbackText: string;
  rating: number; // 1 to 5
  category?: string;
  createdAt: string;
  reply?: string;
}

export interface RestaurantProfile {
  id: number;
  restaurantName: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  username?: string;
  password?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhoneNumber?: string;
  thread_id?: string;
  createdAt?: string;
  token?: string;
}

export interface WhatsAppStatus {
  receiverConnected: boolean;
  botConnected: boolean;
  receiverQr?: string | null;
  botQr?: string | null;
  receiverJid?: string | null;
  botJid?: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  status: 'indexed' | 'indexing' | 'pending';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
  ordersChange: number;
  averageRating: number;
  totalReviews: number;
  positiveRatingRate: number;
  whatsAppActive: boolean;
}
