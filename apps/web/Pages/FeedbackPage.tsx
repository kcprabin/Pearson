import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle2, HeartHandshake } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'Food Quality & Taste',
  'WhatsApp AI Ordering',
  'Delivery & Service Speed',
  'Ambiance & Experience',
  'Value for Money',
];

export const FeedbackPage: React.FC = () => {
  const { restaurantId = '1' } = useParams<{ restaurantId?: string }>();

  const [username, setUsername] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !feedbackText.trim()) return;

    setSubmitting(true);
    try {
      await api.submitFeedback(restaurantId, {
        username: username.trim(),
        restaurantName: 'Sunrise Bistro & Lounge',
        feedbackText: feedbackText.trim(),
        rating,
        category,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor · Needs Improvement',
    2: 'Fair · Below Expectations',
    3: 'Average · It Was Okay',
    4: 'Great · Enjoyed It!',
    5: 'Exceptional · Highly Recommended!',
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#143d3a] font-['Space_Grotesk'] text-lg font-bold text-[#d9e85a]">
              P
            </div>
            <span className="font-['Space_Grotesk'] text-2xl font-extrabold text-[#143d3a]">
              Pearson
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#49756c]">
            Customer Feedback Point
          </p>
          <h1 className="mt-1 font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
            How was your dining experience?
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Your review helps our restaurant and autonomous WhatsApp assistant serve you better.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="mt-4 font-['Space_Grotesk'] text-2xl font-bold text-[#143734]">
                Thank You for Your Review!
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 max-w-sm mx-auto">
                Your feedback has been recorded into our restaurant portal. We look forward to welcoming you back!
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row justify-center">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setUsername('');
                    setFeedbackText('');
                    setRating(5);
                  }}
                  className="rounded-lg bg-[#143d3a] px-4 py-2 text-xs font-bold text-white hover:bg-[#1f5450]"
                >
                  Submit Another Review
                </button>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Restaurant Admin Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div className="text-center pb-2 border-b border-slate-100">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Select Rating
                </span>
                <div className="flex justify-center items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        size={34}
                        className={`transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs font-bold text-slate-700">
                  {ratingDescriptions[hoverRating || rating]}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Your Name or Table Number
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Jordan or Table 5"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              {/* Category tags */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  What are you reviewing?
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

              {/* Feedback text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Your Review / Experience
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you loved, how your dish tasted, or how your WhatsApp order went..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !username.trim() || !feedbackText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#143d3a] py-3 text-xs font-bold text-white transition hover:bg-[#1e524e] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <HeartHandshake size={15} className="text-[#d9e85a]" />
                <span>{submitting ? 'Submitting Review...' : 'Submit Feedback'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Powered by Pearson Autonomous AI Restaurant System
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
