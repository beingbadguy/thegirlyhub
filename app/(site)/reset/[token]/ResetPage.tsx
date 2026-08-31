"use client";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Lock, Check, X } from "lucide-react";

export default function ResetPage({ token }: { token: string }) {
  console.log("Token received:", token); // ✅ Debugging

  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>();
  const [loading, setLoading] = useState(false);

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMinLength = password.length >= 8;

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasLowercase || !hasUppercase || !hasNumber || !isMinLength) {
      setError("Please ensure all password strength requirements are met.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/reset-password/${token}`, { password });
      setError("Password reset successful!");
      router.push("/confirm");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
        setError(error.response?.data?.message || "An error occurred.");
      } else {
        console.error("An unknown error occurred:", error);
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] bg-neutral-50/50 w-full flex flex-col py-6">
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-2 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400">
          <Link
            href="/"
            className="cursor-pointer transition-colors hover:text-neutral-800"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-bold">Reset Password</span>
        </div>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white border border-neutral-100 p-8">
          <h2 className="text-xl font-bold text-center text-neutral-900 mb-6 tracking-tight uppercase">Change Password</h2>

          <form onSubmit={changePassword} className="flex flex-col gap-5 w-full">
            {/* New Password input */}
            <div className="w-full space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">New Password</label>
              <div className="relative flex items-center border border-neutral-200 rounded-xl focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all bg-white w-full px-4 h-12">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none h-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0 ml-2 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Dynamic Validation Checks */}
            <div className="w-full space-y-2 py-1.5 text-left">
              {/* Lowercase check */}
              <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${hasLowercase ? "text-rose-600 font-semibold" : "text-neutral-400"}`}>
                {hasLowercase ? (
                  <Check className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300 shrink-0" />
                )}
                <span>At least one lowercase letter</span>
              </div>

              {/* Length check */}
              <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${isMinLength ? "text-rose-600 font-semibold" : "text-neutral-400"}`}>
                {isMinLength ? (
                  <Check className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300 shrink-0" />
                )}
                <span>Minimum 8 characters</span>
              </div>

              {/* Uppercase check */}
              <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${hasUppercase ? "text-rose-600 font-semibold" : "text-neutral-400"}`}>
                {hasUppercase ? (
                  <Check className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300 shrink-0" />
                )}
                <span>At least one uppercase letter</span>
              </div>

              {/* Number check */}
              <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${hasNumber ? "text-rose-600 font-semibold" : "text-neutral-400"}`}>
                {hasNumber ? (
                  <Check className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300 shrink-0" />
                )}
                <span>At least one number</span>
              </div>
            </div>

            {/* New Confirm Password input */}
            <div className="w-full space-y-1.5 text-left pb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">New Confirm Password</label>
              <div className="relative flex items-center border border-neutral-200 rounded-xl focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all bg-white w-full px-4 h-12">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none h-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0 ml-2 cursor-pointer"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-rose-600 text-xs mt-1 font-semibold">Passwords do not match</p>
              )}
            </div>

            {/* Error notifications */}
            {error && (
              <div className={`text-xs text-center font-semibold p-2.5 border ${error.includes("successful") ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"}`}>
                {error}
              </div>
            )}

            {/* Action buttons Cancel & Reset side-by-side */}
            <div className="flex gap-4 w-full pt-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 h-11 flex items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 font-bold text-xs tracking-wider uppercase hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={loading || !hasLowercase || !hasUppercase || !hasNumber || !isMinLength || password !== confirmPassword}
                type="submit"
                className="flex-1 h-11 flex items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs tracking-wider uppercase disabled:opacity-50 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors cursor-pointer"
              >
                {loading ? (
                  <AiOutlineLoading3Quarters className="animate-spin text-white text-sm" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
