import React, { useState } from 'react';
import { Settings, Save, Check, Key, ShieldCheck } from 'lucide-react';
import { useAuth } from '../Contexts/Authcontext';

interface SettingsTabProps {
  onUpdateRestaurant: (data: {
    RestaurantName?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhoneNumber?: string;
  }) => Promise<boolean>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onUpdateRestaurant }) => {
  const auth = useAuth();
  const user = auth?.user;

  const [restaurantName, setRestaurantName] = useState(user?.name || 'Sunrise Bistro & Lounge');
  const [address, setAddress] = useState(user?.address || '123 Lakeside Boulevard, Pokhara');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '9800000000');
  const [email, setEmail] = useState(user?.email || 'contact@sunrisebistro.com');
  const [ownerName, setOwnerName] = useState(user?.Name || user?.Username || 'Ram Sharma');
  const [ownerEmail, setOwnerEmail] = useState(user?.ownerEmail || 'ram@sunrisebistro.com');
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState(user?.ownerPhoneNumber || '9811111111');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await onUpdateRestaurant({
        RestaurantName: restaurantName,
        address,
        phoneNumber,
        email,
        ownerName,
        ownerEmail,
        ownerPhoneNumber,
      });

      if (ok) {
        auth?.updateUser({
          name: restaurantName,
          Username: ownerName,
          Name: ownerName,
          address,
          phoneNumber,
          email,
          ownerEmail,
          ownerPhoneNumber,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow text-slate-500">SYSTEM CONFIGURATION</span>
        <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
          Restaurant Profile & Settings
        </h2>
        <p className="text-xs text-slate-500">
          Update restaurant contact information, ownership details, and verify integration tokens
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="panel col-span-2">
          <div className="panel-heading border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Settings size={17} className="text-[#143d3a]" />
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Restaurant Information
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Synced with backend API: <code>/hotel/update-restro/:thread_id</code>
            </p>
          </div>

          {saveSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
              <Check size={16} className="text-emerald-600" />
              <span>Restaurant profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Restaurant Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Restaurant Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Owner / Manager Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Owner Email
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Owner Phone Number
                </label>
                <input
                  type="text"
                  value={ownerPhoneNumber}
                  onChange={(e) => setOwnerPhoneNumber(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d9e85a] px-5 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f] disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Credentials */}
        <div className="space-y-4">
          <div className="panel">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Key size={16} className="text-[#143d3a]" />
              <h4 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
                Integration Identifiers
              </h4>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Thread ID (Conversation Anchor)
                </span>
                <code className="mt-1 block rounded bg-slate-100 p-2 font-mono text-[11px] text-slate-700 truncate select-all">
                  {user?.threadId || user?.hotelId || 'demo-thread-pearson-01'}
                </code>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Restaurant ID (Database Primary Key)
                </span>
                <code className="mt-1 block rounded bg-slate-100 p-2 font-mono text-[11px] text-slate-700 select-all">
                  {user?.restaurantId || user?.id || '1'}
                </code>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  API Status
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Authenticated as hotelAdmin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
