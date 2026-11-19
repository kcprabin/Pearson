import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error";

export interface ToastState {
  type: ToastType;
  text: string;
}


export const Toast = ({ toast }: { toast: ToastState | null }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 16, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          className={`absolute top-0 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium z-50 flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-emerald-500/95 text-white backdrop-blur-sm shadow-emerald-500/20"
              : "bg-rose-500/95 text-white backdrop-blur-sm shadow-rose-500/20"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
