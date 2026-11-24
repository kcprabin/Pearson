import React, { useState } from 'react';
import { X, Star, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    username: string;
    feedbackText: string;
    rating: number;
    category: string;
  }) => Promise<void>;
  restaurantName: string;
}

const CATEGORIES = [
  'Food Quality & Taste',
  'WhatsApp AI Ordering',
  'Delivery & Service Speed',
  'Ambiance & Experience',
  'Value for Money',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  restaurantName,
}) => {
  const [username, setUsername] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !feedbackText.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        username: username.trim(),
        rating,
        category,
        feedbackText: feedbackText.trim(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setUsername('');
        setFeedbackText('');
        setRating(5);
        onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: 'Disappointing',
    2: 'Needs Improvement',
    3: 'Average',
    4: 'Great Experience',
    5: 'Exceptional & Delightful!',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Star size={20} className="fill-amber-500" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#143734]">
                Customer Feedback Point
              </h3>
              <p className="text-xs text-slate-500">Record customer review for {restaurantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="mt-4 font-['Space_Grotesk'] text-xl font-bold text-[#143734]">
              Feedback Recorded!
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Thank you for helping us make Pearson voice ordering even better.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Customer Name / Table #
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Jordan Davis or Table 4"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-[#76a495] focus:ring-2 focus:ring-[#e2ede4] focus:outline-none"
              />
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Star Rating
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {ratingDescriptions[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Experience Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      category === cat
                        ? 'bg-[#153e3b] text-white shadow-xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Review text */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Feedback Comments & Suggestions
              </label>
              <textarea
                required
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your dining thoughts, favorite dishes, or thoughts on the AI ordering flow..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:border-[#76a495] focus:ring-2 focus:ring-[#e2ede4] focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <HeartHandshake size={14} className="text-rose-400" />
                <span>Instant submission to restaurant portal</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !feedbackText.trim() || !username.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#d9e85a] px-4 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f] disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
