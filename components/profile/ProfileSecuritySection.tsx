"use client";

import { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Lock,
  Globe,
  HelpCircle,
} from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { UserProfileData } from "@/types/profile";
import axios, { AxiosError } from "axios";

interface ProfileSecuritySectionProps {
  user: UserProfileData;
  onShowToast: (message: string, type: "success" | "error" | "info", title?: string) => void;
}

export default function ProfileSecuritySection({
  user,
  onShowToast,
}: ProfileSecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [formError, setFormError] = useState("");

  const isSocialAuth =
    user.authProvider &&
    ["google", "facebook", "apple"].includes(user.authProvider.toLowerCase());

  // Password Strength Calculation
  const hasMinLen = newPassword.length >= 6;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  let strengthScore = 0;
  if (hasMinLen) strengthScore++;
  if (newPassword.length >= 8) strengthScore++;
  if (hasUpper) strengthScore++;
  if (hasNum) strengthScore++;
  if (hasSpecial) strengthScore++;

  const getStrengthLabel = () => {
    if (!newPassword) return { label: "", color: "bg-stone-200" };
    if (strengthScore <= 2) return { label: "Weak", color: "bg-rose-500", text: "text-rose-600" };
    if (strengthScore <= 3) return { label: "Fair", color: "bg-amber-500", text: "text-amber-600" };
    if (strengthScore <= 4) return { label: "Good", color: "bg-blue-500", text: "text-blue-600" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };
  };

  const strength = getStrengthLabel();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentPassword) {
      setFormError("Current password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await axios.post("/api/user/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.data?.success) {
        onShowToast("Your password was updated successfully!", "success", "Security Updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      let msg = "Could not update password. Please check your current password.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setFormError(msg);
      onShowToast(msg, "error", "Update Failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Password Management */}
        <div className="lg:col-span-2 rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-7 shadow-xs">
          <div className="border-b border-rose-50 pb-4 mb-5">
            <h2 className="font-serif text-xl font-medium text-rose-950">
              Security & Credentials
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage your password, login authorization and active authentication
            </p>
          </div>

          {isSocialAuth ? (
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-xs text-rose-700">
                  <Globe className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    Third-Party Single Sign-On Account
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-md">
                    Your account is securely authenticated using{" "}
                    <span className="font-semibold capitalize text-rose-900">
                      {user.authProvider}
                    </span>
                    . You do not need a GirlyHub password. To update credentials, please visit your {user.authProvider} security settings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Current Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your existing password"
                    className="w-full rounded-xl border border-stone-200 pl-3.5 pr-10 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    New Password <span className="text-rose-600">*</span>
                  </label>
                  {newPassword && (
                    <span className={`text-xs font-bold ${strength.text}`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-stone-200 pl-3.5 pr-10 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {newPassword && (
                  <div className="mt-2 flex gap-1 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${Math.min(100, (strengthScore / 5) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Confirm New Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full rounded-xl border border-stone-200 pl-3.5 pr-10 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="rounded-2xl bg-stone-50 p-3.5 space-y-1.5 text-xs text-stone-600 border border-stone-100">
                <p className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider mb-1">
                  Password Guidelines:
                </p>
                <div className="flex items-center gap-1.5">
                  <Check className={`size-3.5 ${hasMinLen ? "text-emerald-600" : "text-stone-300"}`} />
                  <span>Minimum 6 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`size-3.5 ${hasUpper ? "text-emerald-600" : "text-stone-300"}`} />
                  <span>Contains at least one uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`size-3.5 ${hasNum ? "text-emerald-600" : "text-stone-300"}`} />
                  <span>Contains at least one number (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`size-3.5 ${isMatch ? "text-emerald-600" : "text-stone-300"}`} />
                  <span>Passwords match exactly</span>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-6 py-2.5 text-xs font-semibold text-white hover:bg-rose-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <AiOutlineLoading3Quarters className="size-3.5 animate-spin" />
                      Updating Password…
                    </>
                  ) : (
                    <>
                      <Lock className="size-3.5" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Security Status & Tips */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-rose-100/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-rose-950 font-serif text-lg font-medium mb-3">
              <ShieldCheck className="size-5 text-emerald-600" />
              <h3>Account Safeguards</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Your GirlyHub transactions and data are protected with 256-bit SSL encryption, tokenized payment gateways (Razorpay & Cashfree) and rate-limited API firewalls.
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-stone-700">
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>Encrypted profile storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>Zero card details stored on server</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>Instant email alerts on login</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-stone-200/80 bg-gradient-to-br from-stone-50 to-white p-6 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Need Security Help?
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Suspect unauthorized activity or need assistance recovering your account?
            </p>
            <a
              href="mailto:girlyhubsupport@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline"
            >
              Contact Security Support →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
