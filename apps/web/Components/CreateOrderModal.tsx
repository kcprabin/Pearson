import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '../types/dashboard';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: { username: string; items: string[]; price: number }) => Promise<void>;
  menuItems: MenuItem[];
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  menuItems,
}) => {
  const [username, setUsername] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectMenuItem = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { name: item.name, price: item.price, qty: 1 }];
    });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    const price = parseFloat(customItemPrice) || 10;
    setSelectedItems((prev) => [...prev, { name: customItemName.trim(), price, qty: 1 }]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalPrice = selectedItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || selectedItems.length === 0) return;

    setLoading(true);
    try {
      const itemsList = selectedItems.map((i) =>
        i.qty > 1 ? `${i.name} (x${i.qty})` : i.name,
      );
      await onSubmit({
        username: username.trim(),
        items: itemsList,
        price: totalPrice,
      });
      setUsername('');
      setSelectedItems([]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e2ede4] text-[#1b433e]">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#143734]">
                Create Walk-In / Phone Order
              </h3>
              <p className="text-xs text-slate-500">Record a new order directly into the Pearson kitchen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Customer Name / Phone
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Maya Shrestha (9841234567)"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-[#76a495] focus:ring-2 focus:ring-[#e2ede4] focus:outline-none"
            />
          </div>

          {/* Quick Select Menu Items */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Quick Pick from Menu
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {menuItems.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => handleSelectMenuItem(m)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 transition hover:border-[#173d3b] hover:bg-[#eef5ee]"
                >
                  <Plus size={12} />
                  <span>{m.name}</span>
                  <span className="font-semibold text-emerald-700">${m.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom item entry */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or custom item name..."
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="number"
              placeholder="$"
              value={customItemPrice}
              onChange={(e) => setCustomItemPrice(e.target.value)}
              className="w-18 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              Add
            </button>
          </div>

          {/* Selected Items List */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Order Items ({selectedItems.length})</span>
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>
            {selectedItems.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">
                No items added yet. Click dishes above to add to this order.
              </p>
            ) : (
              <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs shadow-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {item.name} {item.qty > 1 && <span className="text-emerald-700 font-bold">x{item.qty}</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-700">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#d9e85a] px-5 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : `Place Order ($${totalPrice.toFixed(2)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
