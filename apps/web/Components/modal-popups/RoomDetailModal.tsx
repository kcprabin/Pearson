import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateRoomInfo, updateRoomImages, deleteRoom, deleteRoomImage } from "../../Services/hotel.api";
import { Toast } from "../modal-popups/Toast";
import { useToast } from "../../Hooks/useToast";

export interface Room {
  _id: string;
  hotelId: string;
  roomNumber: string;
  roomType: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  pricePerNight: number;
  basePrice?: number;
  weekendPrice?: number;
  capacity: number;
  maxOccupancy?: number;
  floorNumber: number;
  rating: number;
  numberOfReviews?: number;
  discount: number;
  amenities?: string[];
  specialFeatures?: string[];
  roomImages?: string[];
  roomDescription?: string;
  bedType?: string;
  roomSize?: number;
  viewType?: string;
  suitetype?: string;
  cancellationPolicy?: string;
  taxRate?: number;
  minStayNights?: number;
  hasWifi?: boolean;
  hasAC?: boolean;
  hasBalcony?: boolean;
  hasBathtub?: boolean;
  hasShower?: boolean;
  hasHeating?: boolean;
  isAccessible?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onRoomUpdated?: (updatedRoom: Room) => void;
  onRoomDeleted?: (roomId: string) => void;
}

// ─── Constants 

const statusConfig: Record<string, { label: string; cls: string }> = {
  AVAILABLE:   { label: "Available",   cls: "bg-emerald-500/90 text-white" },
  OCCUPIED:    { label: "Occupied",    cls: "bg-blue-500/90 text-white" },
  MAINTENANCE: { label: "Maintenance", cls: "bg-rose-500/90 text-white" },
};

const statusStyles: Record<Room["status"], string> = {
  AVAILABLE:   "bg-emerald-50 border-emerald-300 text-emerald-700",
  OCCUPIED:    "bg-blue-50 border-blue-300 text-blue-700",
  MAINTENANCE: "bg-rose-50 border-rose-300 text-rose-700",
};

const statusOptions: Room["status"][] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];

const ROOM_TYPES = ["STANDARD", "DELUXE", "SUITE"];
const SUITE_TYPES = ["Junior Suite", "Executive Suite", "Presidential Suite", "Penthouse"];
const BED_TYPES = ["Single", "Double", "Queen", "King", "Twin", "Bunk"];
const VIEW_TYPES = ["none", "city", "garden", "beach", "mountain", "street", "pool"];
const CANCELLATION_POLICIES = [
  "Free cancellation up to 24 hours",
  "Free cancellation up to 48 hours",
  "Non-refundable",
  "Flexible",
  "Moderate",
  "Strict",
];
const AMENITY_OPTIONS = [
  "WiFi", "AC", "TV", "Mini Bar", "Safe", "Bathtub",
  "Shower", "Balcony", "Sea View", "King Bed", "Twin Bed",
  "Sofa", "Kitchenette", "Room Service", "Jacuzzi",
];

const boolFeatures = [
  { key: "hasWifi",      icon: "📶", label: "Wi-Fi" },
  { key: "hasAC",        icon: "❄️",  label: "Air Con" },
  { key: "hasBalcony",   icon: "🏞️",  label: "Balcony" },
  { key: "hasBathtub",   icon: "🛁",  label: "Bathtub" },
  { key: "hasShower",    icon: "🚿",  label: "Shower" },
  { key: "hasHeating",   icon: "🔥",  label: "Heating" },
  { key: "isAccessible", icon: "♿",  label: "Accessible" },
  { key: "isFeatured",   icon: "★",  label: "Featured" },
  { key: "isActive",     icon: "✓",  label: "Active" },
] as const;

// ─── Edit form state 

interface EditFormState {
  roomNumber: string;
  status: Room["status"];
  roomType: string;
  suitetype: string;
  viewType: string;
  bedType: string;
  floorNumber: number;
  capacity: number;
  maxOccupancy: number;
  roomSize: number;
  basePrice: number;
  pricePerNight: number;
  weekendPrice: number;
  taxRate: number;
  minStayNights: number;
  discount: number;
  roomDescription: string;
  cancellationPolicy: string;
  amenities: string[];
  specialFeatures: string[];
  hasWifi: boolean;
  hasAC: boolean;
  hasBalcony: boolean;
  hasBathtub: boolean;
  hasShower: boolean;
  hasHeating: boolean;
  isAccessible: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

const initFormData = (r: Room): EditFormState => ({
  roomNumber: r.roomNumber,
  status: r.status,
  roomType: r.roomType.toUpperCase(),
  suitetype: r.suitetype ?? "",
  viewType: r.viewType ?? "none",
  bedType: r.bedType ?? "",
  floorNumber: r.floorNumber,
  capacity: r.capacity,
  maxOccupancy: r.maxOccupancy ?? r.capacity,
  roomSize: r.roomSize ?? 0,
  basePrice: r.basePrice ?? r.pricePerNight,
  pricePerNight: r.pricePerNight,
  weekendPrice: r.weekendPrice ?? r.pricePerNight,
  taxRate: r.taxRate ?? 0,
  minStayNights: r.minStayNights ?? 1,
  discount: r.discount ?? 0,
  roomDescription: r.roomDescription ?? "",
  cancellationPolicy: r.cancellationPolicy ?? "",
  amenities: r.amenities ?? [],
  specialFeatures: r.specialFeatures ?? [],
  hasWifi: !!r.hasWifi,
  hasAC: !!r.hasAC,
  hasBalcony: !!r.hasBalcony,
  hasBathtub: !!r.hasBathtub,
  hasShower: !!r.hasShower,
  hasHeating: !!r.hasHeating,
  isAccessible: !!r.isAccessible,
  isFeatured: !!r.isFeatured,
  isActive: r.isActive ?? true,
});

// ─── Sub-components

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl px-3 py-3 gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 capitalize text-center leading-tight">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-2.5">{children}</p>
  );
}

function Toggle({
  label, checked, onChange, description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <div>
        <p className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition">{label}</p>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
          checked ? "bg-blue-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}

// ─── Delete Room Confirmation Dialog 

function DeleteRoomDialog({
  roomNumber,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  roomNumber: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isDeleting ? undefined : onCancel} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h3 className="text-base font-bold text-slate-900 text-center">Delete Room {roomNumber}?</h3>
        <p className="text-sm text-slate-500 text-center mt-1.5 leading-relaxed">
          This will permanently remove the room and all its images. This action cannot be undone.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDeleting && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isDeleting ? "Deleting..." : "Delete Room"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Image carousel

function ImageCarousel({ images, roomNumber }: { images: string[]; roomNumber: string }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;

  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  useEffect(() => {
    if (current >= total && total > 0) setCurrent(total - 1);
  }, [total, current]);

  if (total === 0) {
    return (
      <div className="h-64 bg-slate-100 flex items-center justify-center flex-shrink-0">
        <span className="text-slate-300 text-sm">No images available</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-64 flex-shrink-0 bg-black overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={`Room ${roomNumber} — image ${current + 1}`}
            className="w-full h-full object-cover cursor-zoom-in"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightbox(true)}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        {total > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`rounded-full transition-all duration-200 ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white/80 text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
          Click to expand
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center" onClick={() => setLightbox(false)}>
            <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white/60 hover:text-white transition w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium">{current + 1} / {total}</p>
            <AnimatePresence mode="wait">
              <motion.img key={current} src={images[current]} alt="" className="max-w-5xl max-h-[80vh] w-full object-contain px-16" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()} />
            </AnimatePresence>
            {total > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
            {total > 1 && (
              <div className="absolute bottom-6 flex gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i); }} className={`w-12 h-9 rounded-md overflow-hidden border-2 transition ${i === current ? "border-blue-400 opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main component 

export const RoomDetailModal = ({ room, isOpen, onClose, onRoomUpdated, onRoomDeleted }: RoomDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditFormState | null>(null);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Delete room state ──
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Delete image state: tracks which URL is currently being deleted ──
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);

  // ── Local copy of images so deletions reflect instantly without a reload ──
  const [localImages, setLocalImages] = useState<string[]>([]);

  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && room) setLocalImages(room.roomImages ?? []);
  }, [isOpen, room]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setFormData(null);
      setNewImageFiles([]);
      setFeatureInput("");
      setShowDeleteDialog(false);
      setDeletingImageUrl(null);
      clearToast();
    }
  }, [isOpen]);

  useEffect(() => {
    const urls = newImageFiles.map(f => URL.createObjectURL(f));
    setNewImagePreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [newImageFiles]);

  if (!room) return null;

  const images = localImages;
  const status = statusConfig[room.status] ?? { label: room.status, cls: "bg-slate-500/90 text-white" };
  const discountedPrice = room.discount > 0 ? room.pricePerNight * (1 - room.discount / 100) : null;
  const enabledFeatures  = boolFeatures.filter(f => (room as any)[f.key]);
  const disabledFeatures = boolFeatures.filter(f => !(room as any)[f.key]);

  const update = <K extends keyof EditFormState>(field: K, value: EditFormState[K]) =>
    setFormData(f => f ? { ...f, [field]: value } : f);

  const toggleAmenity = (a: string) => {
    if (!formData) return;
    update("amenities", formData.amenities.includes(a)
      ? formData.amenities.filter(x => x !== a)
      : [...formData.amenities, a]);
  };

  const addSpecialFeature = () => {
    if (!formData) return;
    const val = featureInput.trim();
    if (val && !formData.specialFeatures.includes(val)) {
      update("specialFeatures", [...formData.specialFeatures, val]);
      setFeatureInput("");
    }
  };

  const removeSpecialFeature = (i: number) => {
    if (!formData) return;
    update("specialFeatures", formData.specialFeatures.filter((_, j) => j !== i));
  };

  const enterEditMode = () => {
    setFormData(initFormData(room));
    setIsEditing(true);
    clearToast();
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData(null);
    setNewImageFiles([]);
    setFeatureInput("");
    clearToast();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = "";
  };

  const removeNewImage = (index: number) =>
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));

const handleDeleteImage = async (imageUrl: string) => {
  setDeletingImageUrl(imageUrl);
  try {
    await deleteRoomImage(room._id, imageUrl);
    const updated = localImages.filter(u => u !== imageUrl);
    setLocalImages(updated);
    onRoomUpdated?.({ ...room, roomImages: updated });
    showToast("success", "Image deleted successfully."); 
  } catch (err: any) {
    showToast("error", err?.response?.data?.message || "Failed to delete image.");
  } finally {
    setDeletingImageUrl(null);
  }
};

  // ── Delete entire room 
  const handleDeleteRoom = async () => {
    setIsDeleting(true);
    try {
      await deleteRoom(room._id);
        setShowDeleteDialog(false); 
    showToast("success", "Room removed successfully."); 
    setTimeout(() => {
      onRoomDeleted?.(room._id);
      onClose();
    }, 1000);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete room.");
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    clearToast();
    try {
      const infoPayload = {
        roomNumber: formData.roomNumber,
        status: formData.status,
        roomType: formData.roomType,
        suitetype: formData.suitetype,
        viewType: formData.viewType,
        bedType: formData.bedType,
        floorNumber: formData.floorNumber,
        capacity: formData.capacity,
        maxOccupancy: formData.maxOccupancy,
        roomSize: formData.roomSize,
        basePrice: formData.basePrice,
        pricePerNight: formData.pricePerNight,
        weekendPrice: formData.weekendPrice,
        taxRate: formData.taxRate,
        minStayNights: formData.minStayNights,
        discount: formData.discount,
        roomDescription: formData.roomDescription,
        cancellationPolicy: formData.cancellationPolicy,
        amenities: formData.amenities,
        specialFeatures: formData.specialFeatures,
        hasWifi: formData.hasWifi,
        hasAC: formData.hasAC,
        hasBalcony: formData.hasBalcony,
        hasBathtub: formData.hasBathtub,
        hasShower: formData.hasShower,
        hasHeating: formData.hasHeating,
        isAccessible: formData.isAccessible,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };

      const infoRes = await updateRoomInfo(room._id, infoPayload);
      let updatedRoom: Room = infoRes?.data?.roomData ?? room;

      if (newImageFiles.length > 0) {
        const fd = new FormData();
        newImageFiles.forEach(file => fd.append("images", file));
        const imgRes = await updateRoomImages(room._id, fd);
        updatedRoom = imgRes?.data?.roomData ?? updatedRoom;
        setLocalImages(updatedRoom.roomImages ?? localImages);
      }

      onRoomUpdated?.(updatedRoom);
      setIsEditing(false);
      setFormData(null);
      setNewImageFiles([]);
      setFeatureInput("");
      showToast("success", "Room updated successfully.");
    } catch (err: any) {
      console.error("Failed to update room:", err);
      showToast("error", err?.response?.data?.message || "Failed to update room. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Shared input class 
  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50";
  const selectCls = `${inputCls} bg-white`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSaving || isDeleting ? undefined : onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden pointer-events-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Toast */}
              <div className="relative h-0 z-[70]">
                <Toast toast={toast} />
              </div>

              {/* Carousel */}
              <div className="relative flex-shrink-0">
                <ImageCarousel images={images} roomNumber={room.roomNumber} />
                <span className={`absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide z-10 ${status.cls}`}>
                  {status.label}
                </span>
                {room.isFeatured && (
                  <span className="absolute top-3 left-24 text-[10px] px-2 py-1 rounded-full bg-yellow-400 text-yellow-900 font-bold z-10">★ Featured</span>
                )}
                <button
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition backdrop-blur-sm disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-5">
                <AnimatePresence mode="wait">

                  {/* ── VIEW MODE ── */}
                  {!isEditing && (
                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h2 className="text-xl font-bold text-slate-900">Room {room.roomNumber}</h2>
                            {room.rating > 0 && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="text-yellow-400">★</span>
                                {room.rating.toFixed(1)}
                                {room.numberOfReviews ? <span className="text-slate-400">({room.numberOfReviews})</span> : null}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 capitalize">
                            {room.roomType}
                            {room.suitetype && room.suitetype !== "N/A" ? ` · ${room.suitetype}` : ""}
                            {room.viewType && room.viewType !== "none" ? ` · ${room.viewType} view` : ""}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {discountedPrice ? (
                            <>
                              <div className="flex items-baseline gap-1.5 justify-end">
                                <span className="text-lg font-bold text-slate-900">Rs. {Math.round(discountedPrice).toLocaleString()}</span>
                                <span className="text-xs text-slate-400 line-through">Rs. {room.pricePerNight.toLocaleString()}</span>
                              </div>
                              <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold mt-0.5">{room.discount}% off</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-slate-900">Rs. {room.pricePerNight.toLocaleString()}</span>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">per night{room.taxRate ? ` · ${room.taxRate}% tax` : ""}</p>
                          {room.weekendPrice && room.weekendPrice !== room.pricePerNight && (
                            <p className="text-[10px] text-slate-500 mt-0.5">Weekend: Rs. {room.weekendPrice.toLocaleString()}</p>
                          )}
                        </div>
                      </div>

                      {room.discount > 0 && (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 text-sm">🏷️</span>
                            <div>
                              <p className="text-xs font-semibold text-emerald-700">{room.discount}% discount applied</p>
                              <p className="text-[11px] text-emerald-500 mt-0.5">You save Rs. {Math.round(room.pricePerNight * room.discount / 100).toLocaleString()} per night</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-emerald-500 line-through">Rs. {room.pricePerNight.toLocaleString()}</p>
                            <p className="text-sm font-bold text-emerald-700">Rs. {Math.round(discountedPrice!).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {room.roomDescription && (
                        <p className="text-sm text-slate-500 leading-relaxed border-l-2 border-blue-200 pl-3 italic">{room.roomDescription}</p>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <StatCard label="Floor"    value={room.floorNumber} />
                        <StatCard label="Capacity" value={`${room.capacity} guests`} />
                        <StatCard label="Max occ." value={`${room.maxOccupancy ?? room.capacity} guests`} />
                        <StatCard label="Bed"      value={room.bedType ?? "—"} />
                        <StatCard label="Size"     value={room.roomSize ? `${room.roomSize} sq ft` : "—"} />
                        <StatCard label="Min stay" value={room.minStayNights ? `${room.minStayNights} night${room.minStayNights > 1 ? "s" : ""}` : "1 night"} />
                      </div>

                      <div>
                        <SectionTitle>Facilities</SectionTitle>
                        <div className="flex flex-wrap gap-1.5">
                          {enabledFeatures.map(({ key, icon, label }) => (
                            <span key={key} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium">
                              <span>{icon}</span>{label}
                            </span>
                          ))}
                          {disabledFeatures.map(({ key, icon, label }) => (
                            <span key={key} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-300 line-through">
                              <span className="opacity-40">{icon}</span>{label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div>
                          <SectionTitle>Amenities</SectionTitle>
                          <div className="flex flex-wrap gap-1.5">
                            {room.amenities.map((a, i) => (
                              <span key={i} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {room.specialFeatures && room.specialFeatures.length > 0 && (
                        <div>
                          <SectionTitle>Special Features</SectionTitle>
                          <div className="flex flex-wrap gap-1.5">
                            {room.specialFeatures.map((f, i) => (
                              <span key={i} className="text-xs bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">✦ {f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <SectionTitle>Details</SectionTitle>
                        <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                          {room.cancellationPolicy && (
                            <div className="flex justify-between items-center px-4 py-2.5">
                              <span className="text-xs text-slate-400">Cancellation</span>
                              <span className="text-xs font-medium text-slate-700 text-right max-w-[55%]">{room.cancellationPolicy}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center px-4 py-2.5">
                            <span className="text-xs text-slate-400">Room ID</span>
                            <span className="font-mono text-[10px] text-slate-400">{room._id}</span>
                          </div>
                          {room.createdAt && (
                            <div className="flex justify-between items-center px-4 py-2.5">
                              <span className="text-xs text-slate-400">Added</span>
                              <span className="text-xs text-slate-600">
                                {new Date(room.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Danger zone ── */}
                      <div className="border border-rose-100 rounded-xl p-4 bg-rose-50/40">
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-rose-400 mb-1">Danger Zone</p>
                        <p className="text-xs text-slate-500 mb-3">Permanently delete this room and all associated images. This cannot be undone.</p>
                        <button
                          onClick={() => setShowDeleteDialog(true)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Room
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── EDIT MODE ── */}
                  {isEditing && formData && (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-6">

                      {/* Basic Info */}
                      <div>
                        <SectionTitle>Basic Info</SectionTitle>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Room Number</label>
                            <input
                              type="text"
                              value={formData.roomNumber}
                              onChange={e => update("roomNumber", e.target.value)}
                              placeholder="e.g. 101, A-202"
                              className={inputCls}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Room Type</label>
                              <select value={formData.roomType} onChange={e => update("roomType", e.target.value)} className={selectCls}>
                                {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Floor Number</label>
                              <input type="number" value={formData.floorNumber} min={0}
                                onChange={e => update("floorNumber", Number(e.target.value))} className={inputCls} />
                            </div>
                          </div>

                          {formData.roomType === "SUITE" && (
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Suite Type</label>
                              <select value={formData.suitetype} onChange={e => update("suitetype", e.target.value)} className={selectCls}>
                                <option value="">Select suite type</option>
                                {SUITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">Status</label>
                            <div className="flex gap-2">
                              {statusOptions.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => update("status", s)}
                                  className={`flex-1 py-2 text-xs rounded-xl border transition font-medium ${
                                    formData.status === s ? statusStyles[s] : "border-slate-200 text-slate-400 hover:bg-slate-50"
                                  }`}
                                >
                                  {statusConfig[s].label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Bed Type</label>
                              <select value={formData.bedType} onChange={e => update("bedType", e.target.value)} className={selectCls}>
                                <option value="">Select bed type</option>
                                {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">View Type</label>
                              <select value={formData.viewType} onChange={e => update("viewType", e.target.value)} className={selectCls}>
                                {VIEW_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                            <textarea
                              value={formData.roomDescription}
                              onChange={e => update("roomDescription", e.target.value)}
                              rows={3}
                              placeholder="Brief description of the room..."
                              className={`${inputCls} resize-none`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div>
                        <SectionTitle>Capacity & Size</SectionTitle>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Capacity</label>
                            <input type="number" min={1} value={formData.capacity}
                              onChange={e => update("capacity", Number(e.target.value))} className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Max Occupancy</label>
                            <input type="number" min={1} value={formData.maxOccupancy}
                              onChange={e => update("maxOccupancy", Number(e.target.value))} className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Size (sq ft)</label>
                            <input type="number" min={0} value={formData.roomSize}
                              onChange={e => update("roomSize", Number(e.target.value))} className={inputCls} />
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div>
                        <SectionTitle>Pricing</SectionTitle>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Price per Night (Rs.)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs.</span>
                              <input type="number" min={0} value={formData.pricePerNight}
                                onChange={e => update("pricePerNight", Number(e.target.value))}
                                className={`${inputCls} pl-10`} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Weekend Price (Rs.) <span className="text-slate-400 font-normal">optional</span></label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs.</span>
                                <input type="number" min={0} value={formData.weekendPrice}
                                  onChange={e => update("weekendPrice", Number(e.target.value))}
                                  className={`${inputCls} pl-10`} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tax Rate (%)</label>
                              <input type="number" min={0} max={100} value={formData.taxRate}
                                onChange={e => update("taxRate", Number(e.target.value))} className={inputCls} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Discount (%)</label>
                              <input type="number" min={0} max={100} value={formData.discount}
                                onChange={e => update("discount", Number(e.target.value))} className={inputCls} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">Min Stay (nights)</label>
                              <input type="number" min={1} value={formData.minStayNights}
                                onChange={e => update("minStayNights", Math.max(1, Number(e.target.value)))} className={inputCls} />
                            </div>
                          </div>

                          {formData.pricePerNight > 0 && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                              <p className="text-xs text-blue-500 font-medium mb-2">Price Preview</p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Base price</span>
                                <span className="text-sm font-semibold text-slate-900">Rs. {formData.pricePerNight.toLocaleString()}</span>
                              </div>
                              {formData.taxRate > 0 && (
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-sm text-slate-500">Tax ({formData.taxRate}%)</span>
                                  <span className="text-sm text-slate-500">+ Rs. {(formData.pricePerNight * formData.taxRate / 100).toLocaleString()}</span>
                                </div>
                              )}
                              {formData.discount > 0 && (
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-sm text-emerald-600">Discount ({formData.discount}%)</span>
                                  <span className="text-sm text-emerald-600">− Rs. {(formData.pricePerNight * formData.discount / 100).toLocaleString()}</span>
                                </div>
                              )}
                              {(formData.discount > 0 || formData.taxRate > 0) && (
                                <div className="border-t border-blue-100 mt-2 pt-2 flex justify-between">
                                  <span className="text-sm font-medium text-slate-700">Final price</span>
                                  <span className="text-sm font-bold text-blue-700">
                                    Rs. {Math.round(formData.pricePerNight * (1 + formData.taxRate / 100) * (1 - formData.discount / 100)).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cancellation Policy</label>
                            <select value={formData.cancellationPolicy} onChange={e => update("cancellationPolicy", e.target.value)} className={selectCls}>
                              <option value="">Select policy</option>
                              {CANCELLATION_POLICIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div>
                        <SectionTitle>Amenities</SectionTitle>
                        <p className="text-xs text-slate-400 mb-3">Select all amenities available in this room</p>
                        <div className="flex flex-wrap gap-2">
                          {AMENITY_OPTIONS.map(a => {
                            const selected = formData.amenities.includes(a);
                            return (
                              <button
                                key={a}
                                type="button"
                                onClick={() => toggleAmenity(a)}
                                className={`px-3 py-1.5 text-xs rounded-full border transition font-medium ${
                                  selected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                }`}
                              >
                                {selected && <span className="mr-1">✓</span>}
                                {a}
                              </button>
                            );
                          })}
                        </div>
                        {formData.amenities.length > 0 && (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3">
                            <p className="text-[11px] text-slate-400 mb-1.5">Selected ({formData.amenities.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {formData.amenities.map(a => (
                                <span key={a} className="text-[11px] bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{a}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Room Facilities */}
                      <div>
                        <SectionTitle>Room Facilities</SectionTitle>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
                          <Toggle label="Air Conditioning" checked={formData.hasAC}  onChange={v => update("hasAC", v)} />
                          <Toggle label="Wi-Fi" checked={formData.hasWifi} onChange={v => update("hasWifi", v)} />
                          <Toggle label="Heating"checked={formData.hasHeating} onChange={v => update("hasHeating", v)} />
                          <Toggle label="Shower"checked={formData.hasShower} onChange={v => update("hasShower", v)} />
                          <Toggle label="Bathtub" checked={formData.hasBathtub} onChange={v => update("hasBathtub", v)} />
                          <Toggle label="Balcony" checked={formData.hasBalcony} onChange={v => update("hasBalcony", v)} />
                          <Toggle
                            label="Wheelchair Accessible"
                            description="Room meets accessibility requirements"
                            checked={formData.isAccessible}
                            onChange={v => update("isAccessible", v)}
                          />
                          <Toggle
                            label="Featured"
                            description="Highlight this room on the listings page"
                            checked={formData.isFeatured}
                            onChange={v => update("isFeatured", v)}
                          />
                          <Toggle
                            label="Active"
                            description="Room is visible and bookable"
                            checked={formData.isActive}
                            onChange={v => update("isActive", v)}
                          />
                        </div>
                      </div>

                      {/* Special Features */}
                      <div>
                        <SectionTitle>Special Features</SectionTitle>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={featureInput}
                            onChange={e => setFeatureInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpecialFeature(); } }}
                            placeholder="e.g. Private pool, Rooftop terrace..."
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={addSpecialFeature}
                            className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                          >
                            Add
                          </button>
                        </div>
                        {formData.specialFeatures.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.specialFeatures.map((f, i) => (
                              <span key={i} className="flex items-center gap-1 text-[11px] bg-violet-50 border border-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                                {f}
                                <button type="button" onClick={() => removeSpecialFeature(i)} className="hover:text-rose-500 transition">✕</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      <div>
                        <SectionTitle>Photos</SectionTitle>

                        {/* Existing images — with per-image delete button */}
                        {images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {images.map((img, i) => (
                              <div
                                key={img}
                                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 group ${
                                  i === 0 ? "border-blue-400" : "border-slate-200"
                                }`}
                              >
                                <img src={img} alt="" className="w-full h-full object-cover" />

                                {/* Cover label */}
                                {i === 0 && (
                                  <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] bg-blue-600 text-white py-0.5 font-semibold">
                                    Cover
                                  </span>
                                )}

                                {/* Delete overlay */}
                                {deletingImageUrl === img ? (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(img)}
                                    disabled={!!deletingImageUrl}
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                                    title="Delete image"
                                  >
                                    <svg className="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New image previews */}
                        {newImagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {newImagePreviews.map((src, i) => (
                              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-300 group">
                                <img src={src} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(i)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        )}

                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelected} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-300 hover:bg-blue-50/40 transition group"
                        >
                          <svg className="w-7 h-7 opacity-40 group-hover:opacity-70 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs font-medium text-slate-500 group-hover:text-blue-500 transition">
                            {images.length > 0 ? "Add more photos" : "Upload photos"}
                          </p>
                          <p className="text-[11px] text-slate-400">JPG, PNG, WEBP — multiple allowed</p>
                        </button>
                        {images.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-1.5">New photos are added alongside existing ones.</p>
                        )}
                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t border-slate-100 px-5 py-4 flex gap-3 bg-white">
                {!isEditing ? (
                  <>
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium">
                      Close
                    </button>
                    <button onClick={enterEditMode} className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
                      Manage Room
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={cancelEdit} disabled={isSaving} className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium disabled:opacity-50">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                      {isSaving && (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>

            </div>
          </motion.div>

          {/* Delete room confirmation dialog */}
          <AnimatePresence>
            {showDeleteDialog && (
              <DeleteRoomDialog
                roomNumber={room.roomNumber}
                isDeleting={isDeleting}
                onConfirm={()=>{handleDeleteRoom();}}
                onCancel={() => setShowDeleteDialog(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};