import React, { useState, useMemo } from 'react';
import {
  Star,
  Copy,
  Check,
  Send,
  QrCode,
  Download,
  Search,
  MessageCircle,
  Sparkles,
  Heart,
  Share2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Feedback } from '../types/dashboard';

interface FeedbackTabProps {
  feedback: Feedback[];
  onSubmitFeedback: (item: {
    username: string;
    feedbackText: string;
    rating: number;
    category?: string;
  }) => Promise<void>;
  onReplyToFeedback: (feedbackId: number | string, replyText: string) => Promise<void>;
  restaurantName: string;
  restaurantId: number | string;
}

const CATEGORIES = [
  'Food Quality & Taste',
  'WhatsApp AI Ordering',
  'Delivery & Service Speed',
  'Ambiance & Experience',
  'Value for Money',
];

export const FeedbackTab: React.FC<FeedbackTabProps> = ({
  feedback,
  onSubmitFeedback,
  onReplyToFeedback,
  restaurantName,
  restaurantId,
}) => {
  // Feedback Submission Form State
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formText, setFormText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter & Search State
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply State
  const [activeReplyId, setActiveReplyId] = useState<number | string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate public feedback link
  const feedbackLink = `${window.location.origin}/feedback/${restaurantId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(feedbackLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitFeedback({
        username: formName.trim(),
        rating: formRating,
        category: formCategory,
        feedbackText: formText.trim(),
      });
      setSubmitSuccess(true);
      setFormName('');
      setFormText('');
      setFormRating(5);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (feedbackId: number | string) => {
    if (!replyText.trim()) return;
    await onReplyToFeedback(feedbackId, replyText.trim());
    setActiveReplyId(null);
    setReplyText('');
  };

  // Analytics
  const analytics = useMemo(() => {
    const total = feedback.length;
    if (total === 0) {
      return {
        avgRating: 5.0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        positivePct: 100,
      };
    }

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let positive = 0;

    feedback.forEach((f) => {
      sum += f.rating;
      dist[f.rating] = (dist[f.rating] || 0) + 1;
      if (f.rating >= 4) positive++;
    });

    return {
      avgRating: sum / total,
      distribution: dist,
      positivePct: Math.round((positive / total) * 100),
    };
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.username.toLowerCase().includes(q) ||
        item.feedbackText.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q));
      return matchesRating && matchesSearch;
    });
  }, [feedback, ratingFilter, searchQuery]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${restaurantName} - Customer Feedback Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(
      `Average Rating: ${analytics.avgRating.toFixed(1)} / 5.0 (${feedback.length} reviews) | Generated: ${new Date().toLocaleString()}`,
      14,
      27,
    );

    const tableData = filteredFeedback.map((f) => [
      f.username,
      `${f.rating} Stars`,
      f.category || 'General',
      f.feedbackText,
      f.reply ? `Replied: ${f.reply}` : 'No reply',
      new Date(f.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Customer', 'Rating', 'Category', 'Feedback Review', 'Owner Reply', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [17, 59, 58] },
    });

    doc.save(`${restaurantName.replace(/\s+/g, '_')}_Feedback_Report.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Share Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow text-slate-500">VOICE & RESTAURANT EXPERIENCE</span>
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
            Customer Feedback Point & Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Gather direct customer ratings, measure diner satisfaction, and collect reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Guest Link'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Shareable Feedback Point Card */}
      <div className="rounded-2xl border border-[#c4ded3] bg-linear-to-r from-[#e7f2ed] to-[#f4faf7] p-5 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#143d3a] text-[#d9e85a]">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-['Space_Grotesk'] text-base font-bold text-[#143d3a]">
                  Public Feedback Point URL & QR Ready
                </h4>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#39635b]">
                Share this direct link with diners on WhatsApp, receipts, or table stands so guests can submit reviews directly.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded bg-white/80 px-2 py-1 font-mono text-xs text-slate-700 border border-slate-200">
                  {feedbackLink}
                </code>
                <a
                  href={`/feedback/${restaurantId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#143d3a] hover:underline"
                >
                  <Share2 size={13} /> Open Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Feedback Point Form & CSAT Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Instant Feedback Submission Point (Kiosk / Staff Entry) */}
        <div className="panel col-span-1 lg:col-span-2">
          <div className="panel-heading border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Submit Customer Review (Feedback Point)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Collect immediate diner feedback at the counter, table, or phone
              </p>
            </div>
          </div>

          {submitSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200">
              <Check size={16} className="text-emerald-600" />
              <span>Thank you! Customer feedback recorded and synchronized to your Pearson dashboard.</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Customer Name / Table
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Maya Shrestha or Table 12"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Star Rating Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Star Rating
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${
                          (hoverRating || formRating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {formRating === 5 && 'Exceptional (5/5)'}
                  {formRating === 4 && 'Great (4/5)'}
                  {formRating === 3 && 'Average (3/5)'}
                  {formRating === 2 && 'Needs Work (2/5)'}
                  {formRating === 1 && 'Poor (1/5)'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Customer Comments & Experience
              </label>
              <textarea
                required
                rows={2}
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="Write guest remarks, dish highlights, or thoughts on the AI ordering speed..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !formName.trim() || !formText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#143d3a] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#1f5450] disabled:opacity-50"
              >
                <Send size={13} className="text-[#d9e85a]" />
                <span>{submitting ? 'Recording...' : 'Record Feedback'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CSAT Score & Rating Breakdown */}
        <div className="panel col-span-1">
          <div className="panel-heading border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                Customer Scorecard
              </h3>
              <p className="text-xs text-slate-500">Live CSAT index</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-['Space_Grotesk'] text-3xl font-extrabold text-slate-900">
                  {analytics.avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              <div className="mt-1 flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(analytics.avgRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }
                  />
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xl font-bold text-emerald-700">
                {analytics.positivePct}%
              </span>
              <p className="text-[11px] text-slate-500">Positive Sentiment</p>
              <p className="text-[10px] text-slate-400">{feedback.length} total reviews</p>
            </div>
          </div>

          {/* Star meter breakdown */}
          <div className="mt-4 space-y-2 text-xs">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = analytics.distribution[star] || 0;
              const pct = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-10 text-[11px] font-medium text-slate-600">
                    {star} ★
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1b504d] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[10px] text-slate-400">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Stream & Filters */}
      <div className="panel">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
              Customer Reviews Stream ({filteredFeedback.length})
            </h3>
            <p className="text-xs text-slate-500">Verified dining guest remarks and replies</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 5, label: '5 ★' },
                  { key: 4, label: '4 ★' },
                  { key: 3, label: '≤ 3 ★' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={String(key)}
                  onClick={() => setRatingFilter(key as any)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    ratingFilter === key
                      ? 'bg-[#143d3a] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
              />
            </div>
          </div>
        </div>

        {/* Review Cards List */}
        <div className="mt-4 divide-y divide-slate-100">
          {filteredFeedback.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No customer reviews matching current filter.
            </div>
          ) : (
            filteredFeedback.map((item) => (
              <div key={item.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e3efe7] font-mono text-xs font-bold text-[#1b433e]">
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-semibold text-slate-900">
                          {item.username}
                        </strong>
                        {item.category && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  {item.feedbackText}
                </p>

                {/* Owner Reply */}
                {item.reply ? (
                  <div className="mt-3 rounded-lg border border-[#cbe0d4] bg-[#f4faf7] p-3 text-xs text-[#1f4a47]">
                    <div className="flex items-center gap-1 font-semibold text-[#143d3a] mb-0.5">
                      <Heart size={13} className="text-rose-500 fill-rose-500" />
                      <span>Restaurant Response:</span>
                    </div>
                    <p className="text-slate-700">{item.reply}</p>
                  </div>
                ) : (
                  <div className="mt-2">
                    {activeReplyId === item.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write reply to guest..."
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                        />
                        <button
                          onClick={() => handleSendReply(item.id)}
                          className="rounded-lg bg-[#143d3a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d524e]"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyText('');
                          }}
                          className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReplyId(item.id)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#183e3a] hover:underline"
                      >
                        <MessageCircle size={13} />
                        <span>Reply to diner</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
