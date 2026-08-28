"use client";
import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";

type Coupon = {
  _id: string;
  name: string;
  code: string;
  discount: number;
  isActive: boolean;
  createdAt: string;
};

const CouponsPage = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch existing coupons
  const fetchCoupons = async () => {
    try {
      const res = await axios.get("/api/coupon", {
        params: { page: 1, limit: 100 },
      });
      setCoupons(res.data.coupons);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Error fetching coupons:", error);
      }
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Submit handler
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post("/api/coupon", {
        name,
        code,
        discount,
      });

      if (res.data.success) {
        setSuccessMsg("Coupon added successfully!");
        setName("");
        setCode("");
        setDiscount(0);
        fetchCoupons(); // Refresh the list
      } else {
        setErrorMsg(res.data.message || "Error adding coupon.");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setErrorMsg(
          error.response?.data?.message ||
            "Something went wrong while adding the coupon.",
        );
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="mt-2 overflow-y-scroll max-h-[90vh] pt-20 pb-20 md:pt-0 md:mb-0 md:px-4">
      <h2 className="text-2xl font-bold mb-4 text-pink-700">Add New Coupon</h2>

      <form onSubmit={handleAddCoupon} className="space-y-4">
        <input
          type="text"
          placeholder="Coupon Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Coupon Code (e.g., SAVE100)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Discount Amount (₹)"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Coupon"}
        </button>
      </form>

      {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-600 mt-2">{successMsg}</p>}

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-2">Existing Coupons</h2>
      {coupons.length === 0 ? (
        <p className="text-gray-600">No coupons found.</p>
      ) : (
        <ul className="space-y-2">
          {coupons.map((coupon) => (
            <li key={coupon._id} className="border p-3 rounded shadow-sm">
              <strong>{coupon.name}</strong> —{" "}
              <span className="text-pink-600 font-mono">{coupon.code}</span> (₹
              {coupon.discount} off)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CouponsPage;
