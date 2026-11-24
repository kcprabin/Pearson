import React from 'react';
import {
  TrendingUp,
  Inbox,
  Star,
  DollarSign,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { Order, Feedback, DashboardMetrics, OrderStatus } from '../types/dashboard';
import type { DashboardView } from './Sidebar';

interface OverviewTabProps {
  metrics: DashboardMetrics;
  orders: Order[];
  feedback: Feedback[];
  onSelectView: (view: DashboardView) => void;
  onUpdateOrderStatus: (orderId: number | string, status: OrderStatus) => Promise<void>;
  onOpenFeedbackModal: () => void;
  restaurantName: string;
}

const HOURLY_SALES_DATA = [
  { time: '10 AM', revenue: 65, orders: 3 },
  { time: '12 PM', revenue: 180, orders: 8 },
  { time: '2 PM', revenue: 240, orders: 11 },
  { time: '4 PM', revenue: 130, orders: 6 },
  { time: '6 PM', revenue: 380, orders: 16 },
  { time: '8 PM', revenue: 520, orders: 22 },
  { time: '10 PM', revenue: 290, orders: 12 },
];

const CATEGORY_DATA = [
  { category: 'Mains', orders: 48, revenue: 980 },
  { category: 'Pizza', orders: 32, revenue: 512 },
  { category: 'Appetizers', orders: 27, revenue: 378 },
  { category: 'Desserts', orders: 19, revenue: 152 },
  { category: 'Beverages', orders: 35, revenue: 175 },
];

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  orders,
  feedback,
  onSelectView,
  onUpdateOrderStatus,
  onOpenFeedbackModal,
  restaurantName,
}) => {
  const recentOrders = orders.slice(0, 5);
  const recentFeedback = feedback.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-linear-to-r from-[#113b3a] to-[#1c5553] p-6 text-white shadow-md sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow text-[#a5c7be]">AUTONOMOUS RESTAURANT SYSTEM</span>
          <h1 className="mt-1 font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[#f4faf7] sm:text-3xl">
            {restaurantName}
          </h1>
          <p className="mt-1 text-xs text-[#b9d3cb]">
            Pearson AI voice ordering is active on WhatsApp. Orders are flowing straight to your kitchen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSelectView('whatsapp')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#245855] px-3.5 py-2 text-xs font-medium text-emerald-200 transition hover:bg-[#2c6966]"
          >
            <MessageSquare size={14} />
            <span>WhatsApp Bot Active</span>
          </button>
          <button
            onClick={onOpenFeedbackModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d9e85a] px-4 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f]"
          >
            <Star size={14} className="fill-[#143936]" />
            <span>Customer Feedback Point</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="stat-card">
          <div className="stat-top">
            <span className="font-medium text-slate-500">Today's Revenue</span>
            <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-700">
              <DollarSign size={16} />
            </div>
          </div>
          <strong className="text-2xl font-bold text-slate-900">
            ${metrics.totalRevenue.toLocaleString()}
          </strong>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <TrendingUp size={13} />
            <span className="font-semibold">+{metrics.revenueChange}%</span>
            <span className="text-slate-400">vs yesterday</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="stat-card">
          <div className="stat-top">
            <span className="font-medium text-slate-500">Active Kitchen Orders</span>
            <div className="rounded-md bg-amber-50 p-1.5 text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <strong className="text-2xl font-bold text-slate-900">{metrics.activeOrders}</strong>
          <p className="mt-2 text-xs text-slate-400">
            {metrics.activeOrders === 0 ? 'All caught up!' : 'Pending or in preparation'}
          </p>
        </div>

        {/* Total Orders */}
        <div className="stat-card">
          <div className="stat-top">
            <span className="font-medium text-slate-500">Total Completed</span>
            <div className="rounded-md bg-teal-50 p-1.5 text-teal-700">
              <Inbox size={16} />
            </div>
          </div>
          <strong className="text-2xl font-bold text-slate-900">{metrics.totalOrders}</strong>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <TrendingUp size={13} />
            <span className="font-semibold">+{metrics.ordersChange}%</span>
            <span className="text-slate-400">new orders today</span>
          </div>
        </div>

        {/* Customer Rating / Feedback Point Summary */}
        <div
          className="stat-card cursor-pointer transition hover:border-[#173d3b]"
          onClick={() => onSelectView('feedback')}
        >
          <div className="stat-top">
            <span className="font-medium text-slate-500">Customer CSAT</span>
            <div className="rounded-md bg-amber-100 p-1.5 text-amber-700">
              <Star size={16} className="fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-slate-900">
              {metrics.averageRating.toFixed(1)}
            </strong>
            <span className="text-xs font-semibold text-amber-600">★★★★★</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Based on <span className="font-semibold text-slate-700">{metrics.totalReviews} reviews</span> ({metrics.positiveRatingRate}% positive)
          </p>
        </div>
      </div>

      {/* Analytics Visual Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales & Orders Flow Area Chart */}
        <div className="panel col-span-2">
          <div className="panel-heading">
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Hourly Order & Revenue Flow
              </h3>
              <p className="text-xs text-slate-500">Live order influx throughout the day</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1b504d]" /> Revenue ($)
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d9e85a]" /> Orders
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b504d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1b504d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f1" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b9b94' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8b9b94' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#133e3b',
                    borderColor: '#245653',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1b504d" strokeWidth={2.5} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="orders" stroke="#d9e85a" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Category Bar Chart */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Category Sales
              </h3>
              <p className="text-xs text-slate-500">Popularity by volume</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f1" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#8b9b94' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8b9b94' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#133e3b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="orders" fill="#1b504d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Split Operational Feeds: Orders & Feedback */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders List */}
        <div className="panel">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Live Kitchen Orders
              </h3>
              <p className="text-xs text-slate-500">Real-time orders placed via WhatsApp & Voice</p>
            </div>
            <button
              onClick={() => onSelectView('orders')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f4e4a] hover:underline"
            >
              View All ({orders.length}) <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const statusColors: Record<OrderStatus, { bg: string; text: string; label: string }> = {
                pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Pending' },
                in_progress: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'In Prep' },
                completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Done' },
                cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Cancelled' },
              };

              const statusStyle = statusColors[order.orderStatus] || statusColors.pending;

              return (
                <div key={order.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e3ece7] font-mono text-xs font-bold text-[#1f4a47]">
                      {order.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-semibold text-slate-900">
                          {order.username}
                        </strong>
                        <span className="font-mono text-[11px] text-slate-400">
                          #{order.id}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {order.items.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      ${order.price}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={() => void onUpdateOrderStatus(order.id, 'in_progress')}
                        className="rounded bg-[#e2ede5] p-1 text-[#173d39] hover:bg-[#d0e0d4]"
                        title="Accept Order"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {order.orderStatus === 'in_progress' && (
                      <button
                        onClick={() => void onUpdateOrderStatus(order.id, 'completed')}
                        className="rounded bg-emerald-100 p-1 text-emerald-800 hover:bg-emerald-200"
                        title="Mark Completed"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Feedback Feed (Core Requirement) */}
        <div className="panel">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Customer Feedback Point Stream
              </h3>
              <p className="text-xs text-slate-500">Ratings & dining impressions from guests</p>
            </div>
            <button
              onClick={() => onSelectView('feedback')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f4e4a] hover:underline"
            >
              Open Point ({feedback.length}) <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentFeedback.map((fb) => (
              <div key={fb.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-semibold text-slate-800">
                      {fb.username}
                    </strong>
                    {fb.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        {fb.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2 italic">
                  "{fb.feedbackText}"
                </p>
                {fb.reply && (
                  <p className="mt-1 text-[11px] text-[#295652] bg-[#f0f6f3] p-1.5 rounded">
                    <strong>Our Reply:</strong> {fb.reply}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Want to collect more customer reviews?</span>
            <button
              onClick={onOpenFeedbackModal}
              className="text-xs font-semibold text-[#183e3a] hover:underline flex items-center gap-1"
            >
              Collect New Feedback <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant Quick Callout */}
      <div className="assistant-panel rounded-2xl flex flex-col justify-between md:flex-row items-center gap-4">
        <div>
          <span className="eyebrow">PEARSON VOICE & CHAT CO-PILOT</span>
          <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#143d3a] mt-1">
            Grounded in your restaurant's menu
          </h3>
          <p className="text-xs text-[#3b625b] mt-1 max-w-xl">
            Our LangGraph-powered conversational agent understands menu items, handles allergens, takes voice orders via WhatsApp, and routes real-time orders directly to your kitchen.
          </p>
        </div>
        <button
          onClick={() => onSelectView('assistant')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#143c39] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1f504c]"
        >
          <Sparkles size={14} className="text-[#d9e85a]" />
          <span>Test Pearson AI Assistant</span>
        </button>
      </div>
    </div>
  );
};
