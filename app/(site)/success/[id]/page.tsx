"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { VscPass } from "react-icons/vsc";
import { useAuthStore } from "@/store/store";
import { Copy } from "lucide-react";
import confetti from "canvas-confetti";

export default function Page() {
  const { user, fetchUser } = useAuthStore();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/order/${id}`);
        const data = await response.json();
        if (data.success && data.order) {
          setPaymentMethod(data.order.paymentMethod);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };
    fetchOrder();
  }, [id]);

  // useEffect(() => {
  //   // if (!id || !user || id.length < 23) router.push("/");

  //   setTimeout(() => {
  //     if (!user) {
  //       console.log("User not logged in, redirecting to home.");
  //       router.push("/");
  //     }
  //   }, 5000);
  //   // if (!user) {
  //   //   console.log("User not logged in, redirecting to home.");
  //   //   router.push("/");
  //   // }
  // }, [id, user]);

  useEffect(() => {
    // Play success sound
    const audio = new Audio("/success.mp3");
    audio.volume = 0.1;
    audio.play();

    // Trigger confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] bg-white text-center px-4">
      <div className="bg-pink-50 p-10 rounded-2xl  w-full max-w-xl">
        <div className="flex justify-center mb-6">
          <VscPass className="text-pink-600 text-6xl" />
        </div>
        <div className="flex items-center justify-center gap-2 w-full mx-2 flex-col md:flex-row">
          <p className="text-sm md:text-base my-2 mx-2 break-all">
            Order ID: {id}
          </p>
          <Copy
            className={`size-4 cursor-pointer transform transition-all duration-300 my-2 ${
              copied ? "scale-125" : "scale-100"
            }`}
            onClick={() => {
              if (id) navigator.clipboard.writeText(id);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 1000);
            }}
          />
        </div>

        <h1 className="text-xl md:text-2xl font-semibold text-black mb-2">
          Thanks {user?.name}, Your Order was Placed Successfully.
        </h1>
        <p className="text-gray-600 mb-6 text-sm md:text-base">
          We will send latest information and updates about your order to{" "}
          {user?.email}
        </p>

        {paymentMethod === "cod" && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-800 text-xs md:text-sm text-center">
            <p className="leading-relaxed">
              <span className="font-bold text-amber-700 mr-1.5">⚠️ Important:</span>
              For Cash on Delivery (COD) orders, <strong>Girlyhub</strong> will call you for order verification.
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push("/")}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-full text-sm cursor-pointer"
          >
            Back to Home
          </Button>
          <Button
            onClick={() => router.push(`/profile`)}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full text-sm cursor-pointer"
          >
            Check Details
          </Button>
        </div>
      </div>
    </div>
  );
}
