import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "Rs. 999",
    description: "For small hotel projects and basic management.",
    features: [
      "Room listing management",
      "Simple booking system",
      "Guest records",
      "Basic dashboard overview",
      "Login system",
    ],
    button: "Start Basic",
    popular: false,
  },
  {
    name: "Standard",
    price: "Rs. 1,999",
    description: "For full semester-level hotel systems.",
    features: [
      "Everything in Basic",
      "Booking status tracking",
      "Simple finance tracking (income only)",
      "Guest reviews management",
      "Basic reports page",
      "Improved UI dashboard",
    ],
    button: "Start Standard",
    popular: true,
  },
  {
    name: "Advanced",
    price: "Rs. 2,999",
    description: "For complete project demonstration.",
    features: [
      "Everything in Standard",
      "Revenue + cancellation tracking",
      "Room pricing management",
      "Simple analytics charts",
      "Export basic reports (CSV)",
    ],
    button: "Start Advanced",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">

      {/* HEADER */}
      <div className="max-w-3xl mx-auto text-center mb-14">
        <h1 className="text-4xl font-bold text-slate-900">
          Simple Pricing
        </h1>
        <p className="mt-4 text-slate-500 text-base">
          Choose a plan based on project complexity. No unnecessary enterprise features.
        </p>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`
              bg-white rounded-2xl border p-7
              shadow-sm hover:shadow-md transition
              ${plan.popular ? "border-blue-500" : "border-slate-200"}
            `}
          >

            {plan.popular && (
              <div className="text-xs font-semibold text-blue-600 mb-3">
                Recommended
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-900">
              {plan.name}
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              {plan.description}
            </p>

            <div className="mt-6 mb-6">
              <span className="text-4xl font-bold text-slate-900">
                {plan.price}
              </span>
              <span className="text-slate-500 text-sm"> / project</span>
            </div>

            <div className="space-y-3 mb-7">
              {plan.features.map((f) => (
                <div key={f} className="flex gap-2 items-start">
                  <Check size={16} className="text-emerald-600 mt-0.5" />
                  <p className="text-sm text-slate-600">{f}</p>
                </div>
              ))}
            </div>

            <button
              className={`
                w-full py-2.5 rounded-xl text-sm font-medium transition
                ${plan.popular
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"}
              `}
            >
              {plan.button}
            </button>

          </motion.div>
        ))}

      </div>

      {/* FOOTNOTE */}
      <p className="text-center text-xs text-slate-400 mt-12">
        Semester project pricing mock — no real payment integration.
      </p>

    </div>
  );
};

export default Pricing;