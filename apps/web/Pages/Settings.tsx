import React, { useEffect, useRef, useState } from "react";
import {
  FaHotel,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaImage,
  FaStar,
  FaWifi,
  FaParking,
  FaSpa,
  FaSwimmingPool,
  FaFileAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaCloudUploadAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { getHotelById, updateHotelInfo, updateHotelGallery, deleteHotelGalleryImage } from "../Services/hotel.api";
import { useAuth } from "../Contexts/Authcontext";
import { Toast } from "../Components/modal-popups/Toast";
import { ImagePreviewModal } from "../Components/modal-popups/ImagePreviewModal";
import { useToast } from "../Hooks/useToast";
import axios from "axios";


interface HotelSettings {
  _id?: string;
  hotelName: string;
  ownerName: string;
  contactNumber: string;
  hotelLocation: string;
  propertyType: string;
  checkinTime: string;
  checkoutTime: string;
  hotelDescription: string;
  facilities: string[];
  images: string[];
  documents: string[];
  esewa_Merchantid?: string;
  khalti_SecretKey?: string;
}

// ─── Constants ────────────────────────────────────────────────

const PROPERTY_TYPES = [
  "Hotel",
  "Resort",
  "Guesthouse",
  "Hostel",
  "Apartment",
  "Villa",
  "Boutique Hotel",
];

const facilityIcons: Record<string, React.ReactNode> = {
  "Free WiFi": <FaWifi />,
  Parking: <FaParking />,
  Spa: <FaSpa />,
  "Swimming Pool": <FaSwimmingPool />,
};

const emptyHotel: HotelSettings = {
  hotelName: "",
  ownerName: "",
  contactNumber: "",
  hotelLocation: "",
  propertyType: "",
  checkinTime: "",
  checkoutTime: "",
  hotelDescription: "",
  facilities: [],
  images: [],
  documents: [],
  esewa_Merchantid: "",
  khalti_SecretKey: "",
};


// ─── Shared UI ────────────────────────────────────────────────

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white border border-slate-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-6 border-b border-slate-100">
    <div className="flex items-center gap-3.5">
      {icon && (
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 text-sm">
          {icon}
        </span>
      )}
      <div>
        <h2 className="text-base font-semibold text-slate-800 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
    {children}
  </label>
);

const inputBase =
  "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-150";
const inputEditable =
  "border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/60";
const inputReadonly =
  "border-transparent bg-slate-50 text-slate-600 cursor-default select-none";
const fieldInput = (editable: boolean) =>
  `${inputBase} ${editable ? inputEditable : inputReadonly}`;

const inputBaseLg =
  "w-full rounded-xl border px-5 py-3.5 text-base outline-none transition-all duration-150";
const fieldInputLg = (editable: boolean) =>
  `${inputBaseLg} ${editable ? inputEditable : inputReadonly}`;


const SettingsPage: React.FC = () => {
  const auth = useAuth();
  const hotelId = auth?.hotelId;

  const [settings, setSettings] = useState<HotelSettings>(emptyHotel);
  const [formData, setFormData] = useState<HotelSettings>(emptyHotel);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [facilityInput, setFacilityInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [pendingImagePreviews, setPendingImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [showEsewaKey, setShowEsewaKey] = useState(false);
  const [showKhaltiKey, setShowKhaltiKey] = useState(false);

  const { toast: pageToast, showToast: showPageToast, clearToast: clearPageToast } = useToast();
  const { toast: imageToast, showToast: showImageToast } = useToast();
  const { toast: passwordToast, showToast: showPasswordToast, clearToast: clearPasswordToast } = useToast();

  const imageInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    const fetchHotel = async () => {
      if (!hotelId) {
        showPageToast("error", "No hotel ID found in auth context.");
        return;
      }
      setLoading(true);
      try {
        const res = await getHotelById(hotelId);
        const hotel = res?.data ?? res;
        console.log("Fetched hotel data:", hotel);
        const mapped: HotelSettings = {
          _id: hotel?._id,
          hotelName: hotel?.hotelName || "",
          ownerName: hotel?.ownerName || "",
          contactNumber: hotel?.contactNumber || "",
          hotelLocation: hotel?.hotelLocation || "",
          propertyType: hotel?.propertyType || "",
          checkinTime: hotel?.checkinTime || "",
          checkoutTime: hotel?.checkoutTime || "",
          hotelDescription: hotel?.hotelDescription || "",
          facilities: Array.isArray(hotel?.facilities) ? hotel.facilities : [],
          images: Array.isArray(hotel?.hotelImages) ? hotel.hotelImages : [],
          documents: Array.isArray(hotel?.VerificationDocuments)
            ? hotel.VerificationDocuments
            : [],
          esewa_Merchantid: hotel?.esewa_Merchantid || "",
          khalti_SecretKey: hotel?.khalti_SecretKey || "",
        };
        setSettings(mapped);
        setFormData(mapped);
      } catch (e) {
        console.error(e);
        showPageToast("error", "Unable to load hotel details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [hotelId]);


  const display = isEditing ? formData : settings;

  const handleField = (field: keyof HotelSettings, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const startEdit = () => {
    setFormData(settings);
    setIsEditing(true);
    clearPageToast();
  };

  const cancelEdit = () => {
    setFormData(settings);
    setFacilityInput("");
    setIsEditing(false);
    clearPageToast();
  };

  const addFacility = () => {
    const value = facilityInput.trim();
    if (!value || formData.facilities.includes(value)) { setFacilityInput(""); return; }
    handleField("facilities", [...formData.facilities, value]);
    setFacilityInput("");
  };

  const removeFacility = (index: number) =>
    handleField("facilities", formData.facilities.filter((_, i) => i !== index));


  const saveDetails = async () => {
    if (!hotelId) return;
    setSaving(true);
    clearPageToast();
    try {
      const payload = {
        hotelName: formData.hotelName,
        ownerName: formData.ownerName,
        contactNumber: formData.contactNumber,
        hotelLocation: formData.hotelLocation,
        propertyType: formData.propertyType,
        checkinTime: formData.checkinTime,
        checkoutTime: formData.checkoutTime,
        hotelDescription: formData.hotelDescription,
        facilities: formData.facilities,
        esewa_Merchantid: formData.esewa_Merchantid,
        khalti_SecretKey: formData.khalti_SecretKey,
      };

      await updateHotelInfo(hotelId, payload);

      setSettings(formData);
      setIsEditing(false);
      showPageToast("success", "Hotel details saved successfully.");
    } catch (err: any) {
      showPageToast(
        "error",
        err?.response?.data?.message || "Failed to save hotel details."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previews = files.map((f) => URL.createObjectURL(f));
    setPendingImageFiles((p) => [...p, ...files]);
    setPendingImagePreviews((p) => [...p, ...previews]);
  };

  const removePendingImage = (index: number) => {
    URL.revokeObjectURL(pendingImagePreviews[index]);
    setPendingImageFiles((p) => p.filter((_, i) => i !== index));
    setPendingImagePreviews((p) => p.filter((_, i) => i !== index));
  };

  const uploadPendingImages = async () => {
    if (!hotelId || !pendingImageFiles.length) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      pendingImageFiles.forEach((f) => fd.append("hotelImages", f));

      const res = await updateHotelGallery(hotelId, fd);

      const updatedImages: string[] =
        res?.data?.hotelImages ?? res?.hotelImages ?? [...settings.images];

      setSettings((p) => ({ ...p, images: updatedImages }));
      setFormData((p) => ({ ...p, images: updatedImages }));

      pendingImagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setPendingImageFiles([]);
      setPendingImagePreviews([]);
      showImageToast("success", "Images uploaded successfully.");
    } catch (err: any) {
      showImageToast("error", err?.response?.data?.message || "Failed to upload images.");
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteExistingImage = async (imageUrl: string) => {
    if (!hotelId) return;
    setDeletingImage(imageUrl);
    try {
      const res = await deleteHotelGalleryImage(hotelId, imageUrl);

      const updatedImages: string[] =
        res?.data?.hotelImages ?? res?.hotelImages ?? settings.images.filter((img) => img !== imageUrl);

      setSettings((p) => ({ ...p, images: updatedImages }));
      setFormData((p) => ({ ...p, images: updatedImages }));
      showImageToast("success", "Image removed.");
    } catch (err: any) {
      showImageToast("error", err?.response?.data?.message || "Failed to delete image.");
    } finally {
      setDeletingImage(null);
    }
  };


  const handleChangePassword = async () => {
    clearPasswordToast();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showPasswordToast("error", "All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      showPasswordToast("error", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showPasswordToast("error", "Passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      showPasswordToast("error", "New password must be different from current password.");
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_AUTH_API_BASE_URL}/update-hotel-user-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      );
      showPasswordToast("success", "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showPasswordToast("error", err?.response?.data?.message || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#f8f9fb] px-4 py-8 sm:px-6 md:px-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Page Toast */}
        <div className="relative h-0">
          <Toast toast={pageToast} />
        </div>

        {/* ── Page Header */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-7 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-blue-500 text-xs font-semibold uppercase tracking-widest mb-1.5">
              <FaHotel />
              Hotel Settings
            </div>
            {loading ? (
              <div className="h-7 w-48 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                {settings.hotelName || "Your Hotel"}
              </h1>
            )}
            <p className="text-xs text-slate-400 mt-1.5">
              Manage your profile, gallery, documents and account security.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
              >
                <FaEdit className="text-xs" />
                Edit Details
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center gap-2 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <FaTimes className="text-xs" />
                  Discard
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveDetails}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaSave className="text-xs" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN */}
          <div className="xl:col-span-2 space-y-8">

            {/* Basic Info */}
            <SectionCard>
              <SectionHeader icon={<FaHotel />} title="Basic Information" subtitle="Core details visible to guests" />
              <div className="px-8 py-9 grid md:grid-cols-2 gap-7">
                <div>
                  <FieldLabel>Hotel Name</FieldLabel>
                  <input
                    value={display.hotelName}
                    readOnly={!isEditing}
                    onChange={(e) => handleField("hotelName", e.target.value)}
                    className={fieldInputLg(isEditing)}
                    placeholder="e.g. The Grand Himalaya"
                  />
                </div>
                <div>
                  <FieldLabel>Owner Name</FieldLabel>
                  <input
                    value={display.ownerName}
                    readOnly={!isEditing}
                    onChange={(e) => handleField("ownerName", e.target.value)}
                    className={fieldInputLg(isEditing)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <FieldLabel>Contact Number</FieldLabel>
                  <div className="relative">
                    <FaPhoneAlt className="absolute top-1/2 -translate-y-1/2 left-5 text-slate-300 text-sm pointer-events-none" />
                    <input
                      value={display.contactNumber}
                      readOnly={!isEditing}
                      onChange={(e) => handleField("contactNumber", e.target.value)}
                      className={`${fieldInputLg(isEditing)} pl-12`}
                      placeholder="+977 98XXXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Property Type</FieldLabel>
                  {isEditing ? (
                    <select
                      value={display.propertyType}
                      onChange={(e) => handleField("propertyType", e.target.value)}
                      className={`${inputBaseLg} ${inputEditable} bg-white`}
                    >
                      <option value="">Select type</option>
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={display.propertyType} readOnly className={fieldInputLg(false)} />
                  )}
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Location</FieldLabel>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute top-1/2 -translate-y-1/2 left-5 text-slate-300 text-sm pointer-events-none" />
                    <input
                      value={display.hotelLocation}
                      readOnly={!isEditing}
                      onChange={(e) => handleField("hotelLocation", e.target.value)}
                      className={`${fieldInputLg(isEditing)} pl-12`}
                      placeholder="City, District, Nepal"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Description */}
            <SectionCard>
              <SectionHeader title="About the Hotel" subtitle="Write a compelling description for guests" />
              <div className="px-8 py-9">
                <textarea
                  value={display.hotelDescription}
                  readOnly={!isEditing}
                  onChange={(e) => handleField("hotelDescription", e.target.value)}
                  rows={10}
                  placeholder={isEditing ? "Describe your property, atmosphere, and what makes it unique…" : ""}
                  className={`${fieldInputLg(isEditing)} resize-none leading-relaxed`}
                />
                {isEditing && (
                  <p className="text-xs text-slate-400 mt-2 text-right">
                    {display.hotelDescription.length} characters
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Verification Documents */}
            <SectionCard>
              <SectionHeader icon={<FaFileAlt />} title="Verification Documents" subtitle="Submitted during registration" />
              <div className="px-8 py-9">
                {settings.documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6">
                    {settings.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="group overflow-hidden rounded-xl border border-slate-100 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all"
                        onClick={() => setPreviewImage(doc)}
                      >
                        <img
                          src={doc}
                          alt={`Document ${index + 1}`}
                          className="h-64 w-full object-contain bg-slate-50"
                        />
                        <div className="px-5 py-3.5 flex items-center gap-2 border-t border-slate-100 bg-white">
                          <FaFileAlt className="text-slate-300 text-sm" />
                          <span className="text-sm text-slate-500 font-medium">Document {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-12 text-center">
                    <FaFileAlt className="text-slate-300 text-2xl" />
                    <p className="text-sm text-slate-400">No documents submitted</p>
                  </div>
                )}
              </div>
            </SectionCard>

          </div>

          {/* ── RIGHT COLUMN */}
          <div className="space-y-8">

            {/* Check-in / Check-out */}
            <SectionCard>
              <SectionHeader icon={<FaClock />} title="Check-in & Check-out" subtitle="Guest arrival and departure times" />
              <div className="px-7 py-7 grid grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Check-in</FieldLabel>
                  {isEditing ? (
                    <input
                      value={display.checkinTime}
                      onChange={(e) => handleField("checkinTime", e.target.value)}
                      placeholder="e.g. 12:00 PM"
                      className={fieldInput(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                      <FaClock className="text-slate-300 text-xs shrink-0" />
                      <span>{display.checkinTime || <span className="text-slate-400 italic">Not set</span>}</span>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Check-out</FieldLabel>
                  {isEditing ? (
                    <input
                      value={display.checkoutTime}
                      onChange={(e) => handleField("checkoutTime", e.target.value)}
                      placeholder="e.g. 11:00 AM"
                      className={fieldInput(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                      <FaClock className="text-slate-300 text-xs shrink-0" />
                      <span>{display.checkoutTime || <span className="text-slate-400 italic">Not set</span>}</span>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Facilities */}
            <SectionCard>
              <SectionHeader title="Facilities" subtitle="Amenities available to guests" />
              <div className="px-7 py-7 space-y-5">
                <div className="flex flex-wrap gap-2.5">
                  {display.facilities.map((facility, i) => (
                    <div
                      key={facility + i}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                    >
                      <span className="text-blue-500 text-xs">{facilityIcons[facility] || <FaStar />}</span>
                      <span className="font-medium text-slate-700">{facility}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFacility(i)}
                          className="text-slate-300 hover:text-rose-500 transition-colors ml-0.5 text-xs"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ))}
                  {display.facilities.length === 0 && (
                    <div className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-7 text-center">
                      <p className="text-xs text-slate-400">No facilities listed yet</p>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      value={facilityInput}
                      onChange={(e) => setFacilityInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFacility())}
                      placeholder="e.g. Free WiFi"
                      className={`flex-1 ${inputBase} ${inputEditable}`}
                    />
                    <button
                      type="button"
                      onClick={addFacility}
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
                    >
                      <FaPlus className="text-xs" />
                      Add
                    </button>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Change Password */}
            <SectionCard>
              <SectionHeader icon={<FaLock />} title="Change Password" subtitle="Keep your account secure" />
              <div className="px-7 py-7 space-y-5">

                {/* Password Toast */}
                <div className="relative h-0">
                  <Toast toast={passwordToast} />
                </div>

                <div>
                  <FieldLabel>Current Password</FieldLabel>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`${inputBase} ${inputEditable} pr-11`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showCurrentPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel>New Password</FieldLabel>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputBase} ${inputEditable} pr-11`}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputBase} ${inputEditable}`}
                    placeholder="Re-enter new password"
                  />
                </div>

                <button
                  type="button"
                  disabled={changingPassword}
                  onClick={handleChangePassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                >
                  {changingPassword ? "Updating…" : "Update Password"}
                </button>
              </div>
            </SectionCard>

            {/* Payment Credentials */}
            <SectionCard>
              <SectionHeader
                icon={<FaStar />}
                title="Payment Credentials"
                subtitle="eSewa and Khalti gateway keys"
              />
              <div className="px-7 py-7 space-y-5">

                {/* eSewa */}
                <div>
                  <FieldLabel>eSewa Merchant ID</FieldLabel>
                  <div className="relative">
                    <input
                      type={showEsewaKey ? "text" : "password"}
                      value={display.esewa_Merchantid || ""}
                      readOnly={!isEditing}
                      onChange={(e) => handleField("esewa_Merchantid", e.target.value)}
                      placeholder={isEditing ? "Enter eSewa Merchant ID" : ""}
                      className={`${fieldInput(isEditing)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEsewaKey((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showEsewaKey ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                </div>

                {/* Khalti */}
                <div>
                  <FieldLabel>Khalti Secret Key</FieldLabel>
                  <div className="relative">
                    <input
                      type={showKhaltiKey ? "text" : "password"}
                      value={display.khalti_SecretKey || ""}
                      readOnly={!isEditing}
                      onChange={(e) => handleField("khalti_SecretKey", e.target.value)}
                      placeholder={isEditing ? "Enter Khalti Secret Key" : ""}
                      className={`${fieldInput(isEditing)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKhaltiKey((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showKhaltiKey ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                    </button>
                  </div>
                </div>

                {!isEditing && (
                  <p className="text-xs text-slate-400">
                    Keep these keys secure and never share them publicly.
                  </p>
                )}
              </div>
            </SectionCard>

          </div>
        </div>

        {/* ── Gallery */}
        <SectionCard>
          <SectionHeader
            icon={<FaImage />}
            title="Hotel Gallery"
            subtitle="Photos guests see when browsing"
            action={
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 text-xs font-semibold text-blue-700 transition-colors"
              >
                <FaCloudUploadAlt />
                Add Photos
              </button>
            }
          />
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleSelectImages}
            className="hidden"
          />
          <div className="px-7 py-7 space-y-6">

            {/* Image Toast */}
            <div className="relative h-0">
              <Toast toast={imageToast} />
            </div>

            {settings.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {settings.images.map((img, i) => (
                  <div
                    key={img + i}
                    className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50"
                  >
                    <img
                      src={img}
                      alt={`Hotel image ${i + 1}`}
                      onClick={() => setPreviewImage(img)}
                      className="h-44 w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none rounded-xl" />
                    <button
                      type="button"
                      disabled={deletingImage === img}
                      onClick={() => deleteExistingImage(img)}
                      className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 bg-white/95 text-rose-500 hover:text-rose-700 rounded-lg border border-white/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 text-xs"
                      title="Remove photo"
                    >
                      {deletingImage === img ? "…" : <FaTrash />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-2xl py-16 text-center">
                <FaImage className="text-slate-300 text-3xl" />
                <div>
                  <p className="text-sm font-medium text-slate-500">No photos yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add photos to attract more guests</p>
                </div>
              </div>
            )}

            {pendingImagePreviews.length > 0 && (
              <div className="border-t border-slate-100 pt-6 space-y-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Ready to upload · {pendingImagePreviews.length} photo{pendingImagePreviews.length > 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                  {pendingImagePreviews.map((src, idx) => (
                    <div
                      key={src}
                      className="relative rounded-xl overflow-hidden border-2 border-dashed border-blue-200 bg-blue-50/30"
                    >
                      <img src={src} alt="" className="h-36 w-full object-cover opacity-80" />
                      <button
                        type="button"
                        onClick={() => removePendingImage(idx)}
                        className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 text-xs shadow-sm"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={uploadingImages}
                  onClick={uploadPendingImages}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaCloudUploadAlt />
                  {uploadingImages
                    ? "Uploading…"
                    : `Upload ${pendingImagePreviews.length} photo${pendingImagePreviews.length > 1 ? "s" : ""}`}
                </button>
              </div>
            )}
          </div>
        </SectionCard>

      </div>

      {/* ── Image Preview Modal */}
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />

    </div>
  );
};

export default SettingsPage;