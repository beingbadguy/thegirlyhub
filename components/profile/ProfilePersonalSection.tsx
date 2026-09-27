"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  ShieldCheck,
  Calendar,
  Sparkles,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { UserProfileData, ProfileMenuKey } from "@/types/profile";
import axios, { AxiosError } from "axios";

interface ProfilePersonalSectionProps {
  user: UserProfileData;
  onRefreshUser: () => Promise<void>;
  onSelectTab: (tab: ProfileMenuKey) => void;
  onShowToast: (message: string, type: "success" | "error" | "info", title?: string) => void;
}

export default function ProfilePersonalSection({
  user,
  onRefreshUser,
  onSelectTab,
  onShowToast,
}: ProfilePersonalSectionProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone ? String(user.phone) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; general?: string }>({});

  const defaultAddress =
    user.addresses?.find((a) => a.isDefault) ||
    (user.address
      ? {
          street: user.address,
          city: user.city,
          state: user.state,
          postalCode: user.zip,
        }
      : null);

  const openModal = () => {
    setName(user.name || "");
    setPhone(user.phone ? String(user.phone) : "");
    setErrors({});
    setShowEditModal(true);
  };

  const validate = () => {
    const errs: { name?: string; phone?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters.";
    }
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      errs.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setErrors({});

    try {
      await axios.put("/api/user", {
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      });

      await onRefreshUser();
      onShowToast("Your personal details have been updated.", "success", "Profile Updated");
      setShowEditModal(false);
    } catch (err: unknown) {
      let msg = "Could not update personal details. Please try again.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrors({ general: msg });
      onShowToast(msg, "error", "Update Failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact & Personal Information Card */}
        <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-rose-50 pb-4 mb-5">
            <div>
              <h2 className="font-serif text-xl font-medium text-rose-950">
                Personal Information
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Primary contact details linked to your account
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Pencil className="size-3" />
              Edit Details
            </button>
          </div>

          <dl className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 mt-0.5">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium text-stone-400">Full Name</dt>
                <dd className="text-sm font-semibold text-rose-950 mt-0.5">
                  {user.name || "Not provided"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 mt-0.5">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <dt className="text-xs font-medium text-stone-400">Email Address</dt>
                  {user.isVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      Verified
                    </span>
                  )}
                </div>
                <dd className="text-sm font-semibold text-rose-950 mt-0.5 break-all">
                  {user.email}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 mt-0.5">
                <Phone className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium text-stone-400">Mobile Phone</dt>
                <dd className="text-sm font-semibold text-rose-950 mt-0.5">
                  {user.phone ? `+91 ${user.phone}` : (
                    <span className="text-stone-400 font-normal italic">
                      No mobile number saved
                    </span>
                  )}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 mt-0.5">
                <Calendar className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium text-stone-400">Member Since</dt>
                <dd className="text-sm font-semibold text-rose-950 mt-0.5">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Active Member"}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Primary Delivery Address Card */}
        <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rose-50 pb-4 mb-5">
              <div>
                <h2 className="font-serif text-xl font-medium text-rose-950">
                  Default Shipping Address
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Used automatically during fast 1-click checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("addresses")}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <MapPin className="size-3" />
                Address Book
              </button>
            </div>

            {defaultAddress?.street ? (
              <div className="rounded-2xl border border-rose-100 bg-[#fffbfa] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded-full">
                    <Check className="size-3" /> Default Shipping
                  </span>
                  {user.phone && (
                    <span className="text-xs text-stone-500">
                      Tel: +91 {user.phone}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-stone-900 mt-2">
                  {user.name}
                </p>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {defaultAddress.street}
                </p>
                <p className="text-sm text-stone-600">
                  {[defaultAddress.city, defaultAddress.state].filter(Boolean).join(", ")}
                  {defaultAddress.postalCode && ` — ${defaultAddress.postalCode}`}
                </p>
                <p className="text-xs text-stone-500 pt-1">India</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-rose-200 bg-[#fff9fa] p-6 text-center">
                <MapPin className="mx-auto size-8 text-rose-300 mb-2" />
                <p className="text-sm font-semibold text-rose-950">
                  No default address saved
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Add your home or office address to enable instant checkout and order tracking.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectTab("addresses")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors cursor-pointer shadow-xs"
                >
                  Add Delivery Address
                </button>
              </div>
            )}
          </div>

          {/* Account Perks & Guarantee Strip */}
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-stone-50 to-rose-50/50 p-4 border border-rose-50 flex items-center justify-between gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span>Safe & encrypted customer records</span>
            </div>
            <span className="font-semibold text-rose-700">GirlyHub Shield</span>
          </div>
        </div>
      </div>

      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-rose-50 pb-4">
              <div>
                <h3 className="font-serif text-xl font-medium text-rose-950">
                  Edit Personal Details
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update your display name and contact phone
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyanshi Sharma"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-rose-500/20 ${
                    errors.name
                      ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                      : "border-stone-200 focus:border-rose-400"
                  }`}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-xs text-rose-600 mt-1">
                    <AlertCircle className="size-3.5" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Mobile Number (India)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className={`w-full rounded-xl border pl-12 pr-3.5 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-rose-500/20 ${
                      errors.phone
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                        : "border-stone-200 focus:border-rose-400"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="flex items-center gap-1 text-xs text-rose-600 mt-1">
                    <AlertCircle className="size-3.5" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Email cannot be changed directly for security purposes.
                </span>
              </div>

              {errors.general && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-50">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <AiOutlineLoading3Quarters className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
