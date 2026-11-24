import React, { useState } from 'react';
import {
  MessageSquare,
  QrCode,
  Smartphone,
  Send,
  CheckCircle2,
  RefreshCw,
  Radio,
} from 'lucide-react';
import type { WhatsAppStatus } from '../types/dashboard';

interface WhatsAppTabProps {
  status: WhatsAppStatus;
  onRefreshStatus: () => Promise<void>;
  onPairPhone: (phone: string) => Promise<string>;
  onSendMessage: (phone: string, message: string) => Promise<boolean>;
  restaurantPhone?: string;
}

export const WhatsAppTab: React.FC<WhatsAppTabProps> = ({
  status,
  onRefreshStatus,
  onPairPhone,
  onSendMessage,
  restaurantPhone = '9800000000',
}) => {
  const [pairingPhone, setPairingPhone] = useState(restaurantPhone);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);

  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from Pearson! Your order is being prepared.');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) return;
    setPairingLoading(true);
    try {
      const code = await onPairPhone(pairingPhone.trim());
      setGeneratedCode(code);
    } finally {
      setPairingLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) return;
    setSendingMessage(true);
    try {
      await onSendMessage(testPhone.trim(), testMessage.trim());
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow text-slate-500">AUTONOMOUS ORDERING ENGINE</span>
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
            WhatsApp Gateway & Voice Ordering
          </h2>
          <p className="text-xs text-slate-500">
            Manage your Baileys WhatsApp sessions, paired phone numbers, and test autonomous messaging
          </p>
        </div>

        <button
          onClick={() => void onRefreshStatus()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={14} />
          <span>Check Status</span>
        </button>
      </div>

      {/* Session Health Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Radio size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Receiver WhatsApp Session</h4>
                <p className="text-xs text-slate-500">Listens for customer voice & text orders</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                status.receiverConnected
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${status.receiverConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {status.receiverConnected ? 'Connected' : 'Connecting / QR'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Ordering Bot Session</h4>
                <p className="text-xs text-slate-500">Sends order updates, invoices & questions</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                status.botConnected
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${status.botConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {status.botConnected ? 'Connected' : 'Pending Link'}
            </span>
          </div>
        </div>
      </div>

      {/* Pairing & Test Tools */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pairing Code Generator */}
        <div className="panel">
          <div className="panel-heading border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone size={17} className="text-[#173e3b]" />
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Link WhatsApp Device
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Generate an 8-character pairing code without camera QR scanning
            </p>
          </div>

          <form onSubmit={handlePair} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Restaurant WhatsApp Phone Number
              </label>
              <input
                type="text"
                required
                value={pairingPhone}
                onChange={(e) => setPairingPhone(e.target.value)}
                placeholder="e.g. 15551234567 or 9800000000"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
              />
            </div>

            <button
              type="submit"
              disabled={pairingLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143d3a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1f5450]"
            >
              <QrCode size={14} className="text-[#d9e85a]" />
              <span>{pairingLoading ? 'Generating...' : 'Get Pairing Code'}</span>
            </button>
          </form>

          {generatedCode && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                Linked Device Pairing Code
              </span>
              <div className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#133e3b]">
                {generatedCode}
              </div>
              <p className="mt-2 text-xs text-emerald-700">
                Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Link with phone number instead, and enter this code.
              </p>
            </div>
          )}
        </div>

        {/* WhatsApp Test Message Sender */}
        <div className="panel">
          <div className="panel-heading border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-[#173e3b]" />
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Send WhatsApp Message Test
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Verify your Baileys outbound messaging pipeline
            </p>
          </div>

          {sendSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Message dispatched to WhatsApp socket!</span>
            </div>
          )}

          <form onSubmit={handleSendTest} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Recipient Phone Number
              </label>
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 9841234567"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Message Content
              </label>
              <textarea
                required
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
              />
            </div>

            <button
              type="submit"
              disabled={sendingMessage || !testPhone.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#d9e85a] px-4 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f] disabled:opacity-50"
            >
              <Send size={13} />
              <span>{sendingMessage ? 'Sending...' : 'Send WhatsApp Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
