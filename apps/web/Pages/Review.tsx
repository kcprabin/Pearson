import React from "react";
import { motion } from "framer-motion";

interface Review {
  id: string;
  guest: string;
  rating: number;
  date: string;
  comment: string;
}


const reviews: Review[] = [
  {
    id: "1",
    guest: "Priya Sharma",
    rating: 5,
    date: "March 27, 2026",
    comment:
      "Absolutely wonderful stay. The room was spotless and staff were warm and helpful.",
  },
  {
    id: "2",
    guest: "David Lee",
    rating: 4,
    date: "March 27, 2026",
    comment:
      "Great room and location. Wi-Fi was slightly unstable but overall good experience.",
  },
  {
    id: "3",
    guest: "Aisha Gurung",
    rating: 5,
    date: "March 25, 2026",
    comment:
      "My 7th stay here. Consistently excellent service and amazing mountain view.",
  },
  {
    id: "4",
    guest: "Rajan Thapa",
    rating: 3,
    date: "March 20, 2026",
    comment:
      "Hot water was inconsistent but staff responded quickly when informed.",
  },
];


const avgRating = 4.7;
const totalReviews = 142;
const fiveStar = 64;


const renderStars = (rating: number) =>
  "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);


const ReviewsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Guest Reviews
        </h1>
        <p className="text-xs text-slate-500">
          All feedback and ratings
        </p>
      </div>

      {/* STATS (ONLY REQUIRED ONES) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Avg. Rating</p>
          <h2 className="text-xl font-semibold text-slate-900">
            {avgRating} <span className="text-sm">/ 5</span>
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">5 Star Reviews</p>
          <h2 className="text-xl font-semibold text-slate-900">
            {fiveStar}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Reviews</p>
          <h2 className="text-xl font-semibold text-slate-900">
            {totalReviews}
          </h2>
        </div>

      </div>

      {/* REVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {reviews.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              bg-white border border-slate-200 rounded-xl p-5
              hover:shadow-md hover:-translate-y-1 transition
            "
          >

            {/* TOP */}
            <div className="flex justify-between items-start mb-3">

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {r.guest}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {r.date}
                </p>
              </div>

              <div className="text-yellow-500 text-sm tracking-wider">
                {renderStars(r.rating)}
              </div>

            </div>

            {/* COMMENT */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {r.comment}
            </p>

          </motion.div>
        ))}

      </div>

    </div>
  );
};

export default ReviewsPage;