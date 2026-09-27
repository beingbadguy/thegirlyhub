"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Camera, Check, Copy, LogOut, ShieldCheck, Sparkles, User as UserIcon } from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import FloralAccent from "@/components/decorations/FloralAccent";
import { UserProfileData } from "@/types/profile";

interface ProfileHeroHeaderProps {
  user: UserProfileData;
  uploadingPhoto: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoggingOut: boolean;
  onLogout: () => void;
  onShowToast: (message: string, type: "success" | "error" | "info", title?: string) => void;
}

export default function ProfileHeroHeader({
  user,
  uploadingPhoto,
  onImageChange,
  isLoggingOut,
  onLogout,
  onShowToast,
}: ProfileHeroHeaderProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Recent";

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("FIRST15");
    setCopiedCode(true);
    onShowToast("Coupon code FIRST15 copied to clipboard!", "success", "Discount Ready");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-rose-100/80 bg-gradient-to-br from-white via-[#fffbfa] to-[#fff4f6] p-6 shadow-sm sm:p-8">
      {/* Decorative ambient elements */}
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-20 select-none">
        <FloralAccent flower={1} size="lg" animation="float" />
      </div>
      <div className="pointer-events-none absolute -left-12 -bottom-12 opacity-15 select-none rotate-45">
        <FloralAccent flower={2} size="md" animation="pulse" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: Avatar + Details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Container with interactive upload */}
          <div className="relative group shrink-0">
            <div className="relative size-24 sm:size-28 overflow-hidden rounded-full border-2 border-white shadow-md bg-gradient-to-tr from-rose-100 to-rose-50 ring-4 ring-rose-50">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User Avatar"}
                  fill
                  sizes="112px"
                  priority
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 font-serif text-3xl font-medium text-white select-none">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-10" />}
                </div>
              )}

              {/* Uploading Overlay */}
              {uploadingPhoto && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                  <AiOutlineLoading3Quarters className="size-6 animate-spin text-rose-300" />
                  <span className="text-[10px] font-semibold mt-1">Uploading</span>
                </div>
              )}

              {/* Hover Trigger Overlay */}
              {!uploadingPhoto && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  title="Change profile photo"
                >
                  <Camera className="size-6 text-white drop-shadow" />
                  <span className="text-[10px] font-medium mt-1">Update</span>
                </button>
              )}
            </div>

            {/* Quick Upload Badge Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              aria-label="Upload profile image"
              className="absolute bottom-0 right-0 z-20 flex size-8 items-center justify-center rounded-full bg-rose-700 text-white shadow-md ring-2 ring-white hover:bg-rose-800 transition-colors cursor-pointer"
            >
              <Camera className="size-3.5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={onImageChange}
            />
          </div>

          {/* User Name & Metadata */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-rose-950 tracking-tight">
                {user.name || "Customer"}
              </h1>
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 shadow-xs">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
                  Standard Account
                </span>
              )}
              {user.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200/60">
                  Administrator
                </span>
              )}
            </div>

            <p className="text-sm text-stone-600 font-normal">{user.email}</p>

            <div className="flex items-center gap-3 pt-1 text-xs text-stone-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span>Member since {formattedDate}</span>
              </span>
              <span>•</span>
              <span className="capitalize">Sign-in via {user.authProvider || "Account"}</span>
            </div>
          </div>
        </div>

        {/* Right: Loyalty Perk Card & Logout */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
          {/* First Order Discount Perk */}
          {!user.firstPurchase ? (
            <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-r from-rose-50 to-pink-50 p-3 sm:px-4 sm:py-3 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-3.5 text-rose-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Welcome Loyalty Perk
                </span>
              </div>
              <p className="text-xs text-stone-600 mb-2">
                Get <span className="font-semibold text-rose-800">15% off</span> your first order
              </p>
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-white px-2.5 py-1 text-xs font-mono font-bold text-rose-950 border border-rose-200">
                  FIRST15
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-800 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="size-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-3 sm:px-4 sm:py-3 text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="size-3" /> VIP Loyalty Member
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Enjoy priority shipping & exclusive deals
              </p>
            </div>
          )}

          {/* Quick Logout Button */}
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <AiOutlineLoading3Quarters className="size-3.5 animate-spin text-rose-700" />
            ) : (
              <LogOut className="size-3.5 text-rose-700" />
            )}
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
