"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  Building,
  Home,
  Tag,
  AlertCircle,
  X,
  Phone,
} from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { SavedAddress, UserProfileData } from "@/types/profile";
import { INDIAN_STATES } from "@/lib/orderValidation";
import axios, { AxiosError } from "axios";

interface ProfileAddressBookProps {
  user: UserProfileData;
  onRefreshUser: () => Promise<void>;
  onShowToast: (message: string, type: "success" | "error" | "info", title?: string) => void;
}

export default function ProfileAddressBook({
  user,
  onRefreshUser,
  onShowToast,
}: ProfileAddressBookProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formLandmark, setFormLandmark] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formPostalCode, setFormPostalCode] = useState("");
  const [formType, setFormType] = useState<string>("home");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Ensure normalized addresses array
  const addresses: SavedAddress[] = Array.isArray(user.addresses) && user.addresses.length > 0
    ? user.addresses
    : user.address
    ? [
        {
          id: `addr_def_${user._id}`,
          type: "home",
          isDefault: true,
          name: user.name || "Default",
          phone: user.phone ? String(user.phone) : "",
          street: user.address,
          city: user.city || "",
          state: user.state || "",
          postalCode: user.zip ? String(user.zip) : "",
          country: user.country || "India",
          landmark: user.landmark || "",
        },
      ]
    : [];

  const openAddModal = () => {
    setEditingAddressId(null);
    setFormName(user.name || "");
    setFormPhone(user.phone ? String(user.phone) : "");
    setFormStreet("");
    setFormLandmark("");
    setFormCity(user.city || "");
    setFormState(user.state || "");
    setFormPostalCode(user.zip ? String(user.zip) : "");
    setFormType("home");
    setFormIsDefault(addresses.length === 0);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setFormName(addr.name || user.name || "");
    setFormPhone(addr.phone || (user.phone ? String(user.phone) : ""));
    setFormStreet(addr.street || "");
    setFormLandmark(addr.landmark || "");
    setFormCity(addr.city || "");
    setFormState(addr.state || "");
    setFormPostalCode(addr.postalCode || "");
    setFormType(addr.type || "home");
    setFormIsDefault(Boolean(addr.isDefault));
    setFieldErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!formName.trim() || formName.trim().length < 2) {
      errs.name = "Full name is required (min 2 characters).";
    }

    const cleanPhone = formPhone.trim();
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9).";
    }

    if (!formStreet.trim() || formStreet.trim().length < 5) {
      errs.street = "Street address must be at least 5 characters.";
    }

    if (!formCity.trim() || formCity.trim().length < 2) {
      errs.city = "City is required.";
    }

    if (!formState.trim()) {
      errs.state = "Please select a state.";
    }

    const cleanPin = formPostalCode.trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      errs.postalCode = "Enter a valid 6-digit PIN code.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let updatedList: SavedAddress[] = [...addresses];

      const newAddressItem: SavedAddress = {
        id: editingAddressId || `addr_${Date.now()}`,
        type: formType,
        isDefault: formIsDefault || addresses.length === 0,
        name: formName.trim(),
        phone: formPhone.trim(),
        street: formStreet.trim(),
        landmark: formLandmark.trim() || undefined,
        city: formCity.trim(),
        state: formState.trim(),
        postalCode: formPostalCode.trim(),
        country: "India",
      };

      if (editingAddressId) {
        updatedList = updatedList.map((item) =>
          item.id === editingAddressId ? newAddressItem : item
        );
      } else {
        updatedList.push(newAddressItem);
      }

      // If marked as default, remove isDefault from others
      if (newAddressItem.isDefault) {
        updatedList = updatedList.map((item) => ({
          ...item,
          isDefault: item.id === newAddressItem.id,
        }));
      }

      await axios.put("/api/user", {
        addresses: updatedList,
      });

      await onRefreshUser();
      onShowToast(
        editingAddressId ? "Address updated successfully." : "New address added.",
        "success",
        "Address Saved"
      );
      setShowModal(false);
    } catch (err: unknown) {
      let msg = "Could not save address. Please check your inputs.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      onShowToast(msg, "error", "Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);
    try {
      const updatedList = addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));

      await axios.put("/api/user", {
        addresses: updatedList,
      });

      await onRefreshUser();
      onShowToast("Default delivery address updated.", "success", "Default Changed");
    } catch (err) {
      onShowToast("Failed to set default address.", "error");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm("Are you sure you want to remove this address?")) return;

    setDeletingId(addressId);
    try {
      let updatedList = addresses.filter((addr) => addr.id !== addressId);

      // If removed was default, make the first one default if exists
      if (updatedList.length > 0 && !updatedList.some((a) => a.isDefault)) {
        updatedList[0].isDefault = true;
      }

      await axios.put("/api/user", {
        addresses: updatedList,
      });

      await onRefreshUser();
      onShowToast("Address removed from your address book.", "info", "Address Removed");
    } catch (err) {
      onShowToast("Failed to delete address.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "work":
        return <Building className="size-3.5" />;
      case "home":
        return <Home className="size-3.5" />;
      default:
        return <Tag className="size-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-rose-950">
            Address Book
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your delivery destinations for lightning-fast checkout
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-800 transition-colors shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="size-4" />
          Add New Address
        </button>
      </div>

      {/* Addresses Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`relative flex flex-col justify-between rounded-3xl border p-5 sm:p-6 transition-all duration-200 ${
              addr.isDefault
                ? "border-rose-300 bg-gradient-to-b from-white to-[#fff8f9] shadow-sm ring-1 ring-rose-200"
                : "border-stone-200/90 bg-white hover:border-rose-200 hover:shadow-xs"
            }`}
          >
            <div>
              {/* Card Badges Row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 capitalize">
                  {getTypeIcon(addr.type)}
                  {addr.type || "Shipping"}
                </span>

                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                    <Check className="size-3" /> Default
                  </span>
                )}
              </div>

              {/* Recipient & Street info */}
              <h3 className="font-semibold text-stone-900 text-sm">{addr.name}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {addr.street}
              </p>
              {addr.landmark && (
                <p className="text-xs text-stone-500 mt-0.5 italic">
                  Landmark: {addr.landmark}
                </p>
              )}
              <p className="text-xs text-stone-600 mt-1 font-medium">
                {[addr.city, addr.state].filter(Boolean).join(", ")}
                {addr.postalCode && ` — ${addr.postalCode}`}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">India</p>

              {addr.phone && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 px-2.5 py-1 rounded-lg w-fit">
                  <Phone className="size-3 text-rose-600" />
                  <span>+91 {addr.phone}</span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <div>
                {!addr.isDefault && (
                  <button
                    type="button"
                    disabled={settingDefaultId === addr.id}
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {settingDefaultId === addr.id ? "Setting…" : "Set Default"}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(addr)}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Edit address"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={deletingId === addr.id}
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete address"
                >
                  {deletingId === addr.id ? (
                    <AiOutlineLoading3Quarters className="size-3.5 animate-spin text-rose-600" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Address Dashed Card */}
        <button
          type="button"
          onClick={openAddModal}
          className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-rose-200 bg-[#fffbfa]/60 p-6 text-center transition-all hover:bg-rose-50/50 hover:border-rose-400 cursor-pointer group"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-700 transition-transform group-hover:scale-110">
            <Plus className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-rose-950">Add Another Address</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Add home, work or friend's address
          </p>
        </button>
      </div>

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-rose-50 pb-4">
              <div>
                <h3 className="font-serif text-xl font-medium text-rose-950">
                  {editingAddressId ? "Edit Delivery Address" : "Add Delivery Address"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Saved details will be available for quick checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="mt-5 space-y-4">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Contact Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Recipient's name"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                      fieldErrors.name
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-stone-200 focus:border-rose-400"
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile"
                      className={`w-full rounded-xl border pl-10 pr-3 py-2 text-sm outline-none transition ${
                        fieldErrors.phone
                          ? "border-rose-400 bg-rose-50/30"
                          : "border-stone-200 focus:border-rose-400"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Street Address <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formStreet}
                  onChange={(e) => setFormStreet(e.target.value)}
                  placeholder="Flat, House no., Building, Apartment, Street name"
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                    fieldErrors.street
                      ? "border-rose-400 bg-rose-50/30"
                      : "border-stone-200 focus:border-rose-400"
                  }`}
                />
                {fieldErrors.street && (
                  <p className="text-[11px] text-rose-600 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {fieldErrors.street}
                  </p>
                )}
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Landmark <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formLandmark}
                  onChange={(e) => setFormLandmark(e.target.value)}
                  placeholder="Near Metro, Temple, Market, etc."
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                      fieldErrors.city
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-stone-200 focus:border-rose-400"
                    }`}
                  />
                  {fieldErrors.city && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    State <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition bg-white ${
                      fieldErrors.state
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-stone-200 focus:border-rose-400"
                    }`}
                  >
                    <option value="">Select Indian State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.state && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.state}
                    </p>
                  )}
                </div>
              </div>

              {/* PIN Code & Address Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    PIN Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit PIN"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                      fieldErrors.postalCode
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-stone-200 focus:border-rose-400"
                    }`}
                  />
                  {fieldErrors.postalCode && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.postalCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Address Label
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {(["home", "work", "other"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormType(t)}
                        className={`rounded-lg py-1.5 text-xs font-semibold capitalize border transition cursor-pointer ${
                          formType === t
                            ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Set as Default Checkbox */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="size-4 rounded text-rose-700 focus:ring-rose-500 accent-rose-700"
                />
                <span className="text-xs font-medium text-stone-700">
                  Set as default shipping address
                </span>
              </label>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    "Save Address"
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
