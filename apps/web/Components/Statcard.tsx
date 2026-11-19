import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface StatCardProps extends HTMLMotionProps<"div"> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon, trend, className = "", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          rounded-xl border bg-white
          border-slate-200
          p-5 transition-all duration-200

          hover:shadow-md hover:border-blue-200
          ${className}
        `}
        {...props}
      >
        <div className="flex items-center justify-between">

          <div className="space-y-1">
            <p className="text-xs text-slate-400">
              {title}
            </p>

            <h2 className="text-2xl font-semibold text-slate-900">
              {value}
            </h2>

            {trend && (
              <span className="text-xs text-slate-500">
                {trend}
              </span>
            )}
          </div>

          {icon && (
            <div className="
              p-3 rounded-lg
              bg-blue-50
              text-blue-600
              transition-colors
              hover:bg-blue-100
            ">
              {icon}
            </div>
          )}

        </div>
      </motion.div>
    );
  }
);

StatCard.displayName = "StatCard";

