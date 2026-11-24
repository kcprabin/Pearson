import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, OrderStatus } from '../types/dashboard';

interface OrdersTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: number | string, status: OrderStatus) => Promise<void>;
  onOpenCreateOrder: () => void;
  restaurantName: string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onUpdateOrderStatus,
  onOpenCreateOrder,
  restaurantName,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = activeFilter === 'all' || order.orderStatus === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.username.toLowerCase().includes(q) ||
        String(order.id).includes(q) ||
        order.items.some((item) => item.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.orderStatus === 'pending').length,
      preparing: orders.filter((o) => o.orderStatus === 'preparing').length,
      completed: orders.filter((o) => o.orderStatus === 'completed').length,
      cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
    };
  }, [orders]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${restaurantName} - Orders Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);

    const tableData = filteredOrders.map((o) => [
      `#${o.id}`,
      o.username,
      o.items.join(', '),
      `$${o.price}`,
      o.orderStatus.toUpperCase(),
      new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Order ID', 'Customer', 'Items Ordered', 'Total', 'Status', 'Time']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [17, 59, 58] },
    });

    doc.save(`${restaurantName.replace(/\s+/g, '_')}_Orders.pdf`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Pending' },
      preparing: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', label: 'Preparing' },
      completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Completed' },
      cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', label: 'Cancelled' },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow text-slate-500">KITCHEN DISPLAY SYSTEM & ORDERS</span>
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
            Order Flow Management
          </h2>
          <p className="text-xs text-slate-500">
            Real-time feed of autonomous WhatsApp orders and staff entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={onOpenCreateOrder}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#d9e85a] px-3.5 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f]"
          >
            <Plus size={15} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { key: 'all', label: 'All Orders', count: counts.all },
              { key: 'pending', label: 'Pending', count: counts.pending },
              { key: 'preparing', label: 'Preparing', count: counts.preparing },
              { key: 'completed', label: 'Completed', count: counts.completed },
              { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ] as const
          ).map(({ key, label, count }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#143d3a] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-[#d9e85a] text-[#143d3a]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, #ID, or dish..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#76a495] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#76a495]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Filter size={20} />
            </div>
            <h4 className="mt-3 font-semibold text-slate-700">No orders found</h4>
            <p className="text-xs text-slate-400">
              {searchQuery ? 'Try adjusting your search query' : 'No orders in this status category'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {order.username}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ${order.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(order.orderStatus)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.orderStatus === 'pending' && (
                          <button
                            onClick={() => void onUpdateOrderStatus(order.id, 'preparing')}
                            className="inline-flex items-center gap-1 rounded bg-[#e2ede5] px-2.5 py-1 text-xs font-semibold text-[#173d39] transition hover:bg-[#d0e0d4]"
                          >
                            <Check size={13} />
                            <span>Accept</span>
                          </button>
                        )}
                        {order.orderStatus === 'preparing' && (
                          <button
                            onClick={() => void onUpdateOrderStatus(order.id, 'completed')}
                            className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200"
                          >
                            <CheckCircle2 size={13} />
                            <span>Done</span>
                          </button>
                        )}
                        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed' && (
                          <button
                            onClick={() => void onUpdateOrderStatus(order.id, 'cancelled')}
                            className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Cancel Order"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
