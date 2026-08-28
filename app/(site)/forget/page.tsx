"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function ForgetPage() {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Forgot Password | GirlyHub";
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!userEmail) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/forget", { email: userEmail });
      // console.log(response.data);
      setError(response?.data?.message);
      setUserEmail("");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error?.response?.data);
        setError(error.response?.data?.message);
      } else {
        console.error("An error occurred:", error);
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center flex-col gap-2 ">
      <p>Enter Your email</p>
      <Input
        type="email"
        placeholder="Email"
        className=" w-[90%] md:w-[50%] border-gray-400 ring-black border p-2 ring-2  focus:ring-4 focus:ring-blue-400"
        value={userEmail}
        onChange={(e) => {
          setUserEmail(e.target.value);
        }}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button
        disabled={loading}
        className="bg-black text-white cursor-pointer"
        onClick={handleSubmit}
      >
        {loading ? (
          <AiOutlineLoading3Quarters className=" animate-spin text-white" />
        ) : (
          "Forget Password"
        )}
      </Button>
    </div>
  );
}
