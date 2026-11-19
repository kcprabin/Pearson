import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export interface ImagePreviewModalProps {
  src: string | null;
  onClose: () => void;
}

export const ImagePreviewModal = ({ src, onClose }: ImagePreviewModalProps) => {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Preview</span>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
            <img
              src={src}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain bg-slate-950"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};