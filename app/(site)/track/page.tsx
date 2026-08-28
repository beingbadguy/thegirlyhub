"use client";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { FaSearch } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdErrorOutline } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";

type Order = {
  _id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  address: string;
  products: {
    image: string;
    title: string;
    quantity: number;
  }[];
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Track Order | GirlyHub";
  }, []);

  const handleTrackOrder = async () => {
    setOrder(null);
    setError("");
    if (!orderId) {
      setError("Please enter your Order ID.");
      return;
    }
    if (orderId.length !== 24) {
      setError("Please enter a valid Order ID.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await axios.get(`/api/order/${orderId}`);
      console.log(response.data);
      setOrder(response.data.order);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
        setError("Order not found. Please check your Order ID.");
      } else {
        setError("Something went wrong while fetching the order.");
        console.log(error);
      }
    } finally {
      setLoading(false);
      setOrderId("");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full  bg-white rounded-xl p-6 space-y-6">
        <h1 className="md:text-2xl font-semibold text-center flex items-center justify-center gap-2">
          <BsBoxSeam className="text-black" />
          Track Your Order
        </h1>

        <div className=" md:flex gap-2 w-full md:auto">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your Order ID"
            className="flex-1 px-4 py-2 border rounded-md outline-black w-full md:w-auto"
          />
          <button
            onClick={handleTrackOrder}
            className="bg-black hover:bg-black/80 text-white px-4 py-2 md:py-0 rounded-md flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer my-2 md:my-0"
            disabled={loading}
          >
            {loading ? (
              <AiOutlineLoading3Quarters className="animate-spin" />
            ) : (
              <>
                <FaSearch /> Track
              </>
            )}
          </button>
        </div>

        {error && (
          <div className=" text-sm md:text-md text-red-600  rounded-md flex items-center gap-2 ">
            <MdErrorOutline className="md:text-lg" />
            <span>{error}</span>
          </div>
        )}

        {order && <div className="mt-4 space-y-2 border-t " />}

        {order && (
          <div className="flex items-start md:items-center flex-col md:flex-row gap-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {order.products?.map((product, index) => (
                <img
                  key={index}
                  src={product.image}
                  alt=""
                  className={` h-36 w-36 md:w-42 md:h-42  object-contain rounded-md  `}
                />
              ))}
            </div>
            <div className="">
              <p>
                <span className="font-semibold">Order ID:</span> {order._id}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className="capitalize text-pink-600">
                  {order.status}
                </span>
              </p>
              <p>
                <span className="font-semibold">Products:</span>{" "}
                {order.products?.map((product, index) => (
                  <span key={index} className="capitalize">
                    {product.title}
                    {index < order.products.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              <p>
                <span className="font-semibold">Amount:</span> ₹
                {order.totalAmount}
              </p>
              <p>
                <span className="font-semibold">Items:</span>{" "}
                {order.products?.length}{" "}
                {order.products?.length > 1 ? "items" : "item"}
              </p>
              <p>
                <span className="font-semibold">Address:</span> {order.address}
              </p>
              <p>
                <span className="font-semibold">Placed on:</span>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
