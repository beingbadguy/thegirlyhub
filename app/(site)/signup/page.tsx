"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdArrowRightAlt } from "react-icons/md";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = "Sign Up | GirlyHub";
  }, []);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [signupError, setSignupError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const signupHandler = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/signup", data);
      // console.log(response.data);
      router.push(`/verify?email=${encodeURIComponent(data.email)}&next=/`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        setSignupError(error.response?.data.message);
      } else {
        console.error("An unknown error occurred:", error);
        setSignupError("An unknown error occured, try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-[78vh] bg-[#fcfcfb] text-black w-full flex flex-col px-4 py-10">
      {/* Breadcrumbs */}
      <div className="w-full  mx-auto px-4 md:px-8 pb-2 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400">
          <Link
            href="/"
            className="cursor-pointer transition-colors hover:text-neutral-800"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 font-bold">Signup</span>
        </div>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center gap-4 flex-col px-4">
        <div className="w-full max-w-[430px] px-0 py-6">
          <h1 className="text-center text-[27px] font-semibold tracking-[-0.03em]">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Join GirlyHub and discover something lovely.
          </p>

          <form
            className="flex items-center justify-center gap-3 flex-col w-full mt-7"
            onSubmit={signupHandler}
          >
            <Input
              type="text"
              placeholder="Full name"
              name="name"
              className="h-12 w-full rounded-xl border-black/10 bg-[#fcfcfb] px-4"
              value={data.name}
              onChange={changeHandler}
            />
            <Input
              type="email"
              placeholder="Email"
              name="email"
              className="h-12 w-full rounded-xl border-black/10 bg-[#fcfcfb] px-4"
              value={data.email}
              onChange={changeHandler}
            />
            <div className="relative w-full">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                className="h-12 w-full rounded-xl border-black/10 bg-[#fcfcfb] px-4 pr-12"
                value={data.password}
                onChange={changeHandler}
              />
              {showPassword ? (
                <FiEye
                  className="absolute top-[10px] right-4 cursor-pointer"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                />
              ) : (
                <FiEyeOff
                  className="absolute top-[10px] right-4 cursor-pointer"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                />
              )}
            </div>
            <Button
              disabled={loading}
              type="submit"
              className="h-12 bg-rose-600 hover:bg-rose-700 text-white w-full cursor-pointer transition-colors rounded-xl"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className=" animate-spin text-white" />
              ) : (
                <div className="flex items-center gap-4">
                  <p>Create Account</p>
                  <MdArrowRightAlt />
                </div>
              )}
            </Button>
            {signupError && (
              <div className="text-red-500 font-light text-sm">
                {signupError}
              </div>
            )}
            <Link
              href="/login"
              className="text-sm md:text-md text-neutral-500 hover:text-rose-500 transition-colors"
            >
              Already have an account? Login
            </Link>
            <SocialAuthButtons />
          </form>
        </div>
      </div>
    </div>
  );
}
