"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdArrowRightAlt } from "react-icons/md";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function LoginPage() {
  const { setUser, fetchUserCart, syncCartAfterAuth } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    document.title = "Login | GirlyHub";
  }, []);
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const loginHandler = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/login", data);
      // console.log(response.data);
      setUser(response.data.data);
      await syncCartAfterAuth();
      fetchUserCart();
      router.push("/");
      // if (await response.data.data.isVerified) {
      // } else {
      //   router.push("/verify"); // Redirect to home page after successful login
      // }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        const details = error.response?.data;
        if (details?.needsVerification) {
          router.push(
            `/verify?email=${encodeURIComponent(details.email || data.email)}&next=/`,
          );
          return;
        }
        setLoginError(details?.message || "Unable to sign in.");
      } else {
        console.error("An unknown error occurred:", error);
        setLoginError("An unknown error occured, try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-[78vh] bg-[#fcfcfb] text-black w-full flex flex-col">
      {/* Breadcrumbs */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Login</span>
        </nav>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex items-center justify-center gap-4 flex-col px-4">
        <div className="w-full max-w-[430px] px-0 py-6">
          <h1 className="text-center text-[27px] font-semibold tracking-[-0.03em]">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Sign in to continue to GirlyHub.
          </p>

          <form
            className="flex items-center justify-center gap-3 flex-col w-full mt-7"
            onSubmit={loginHandler}
          >
            <Input
              type="email"
              placeholder="Email"
              name="email"
              value={data.email}
              onChange={changeHandler}
              className="h-12 w-full rounded-xl border-black/10 bg-[#fcfcfb] px-4"
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer flex items-center justify-center p-1 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff className="size-5" />
                ) : (
                  <FiEye className="size-5" />
                )}
              </button>
            </div>

            <Link
              href={"/forget"}
              className="w-full text-right text-sm text-neutral-500 hover:text-rose-500 transition-colors"
            >
              Forget Password
            </Link>
            <Button
              disabled={loading}
              type="submit"
              className="h-12 bg-rose-600 hover:bg-rose-700 text-white w-full cursor-pointer transition-colors rounded-xl"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className=" animate-spin text-white" />
              ) : (
                <div className="flex items-center gap-4">
                  <p>Log In</p>
                  <MdArrowRightAlt />
                </div>
              )}
            </Button>
            {loginError && (
              <div className="text-red-500 font-light text-sm">
                {loginError}
              </div>
            )}
            <Link
              href="/signup"
              className="text-sm md:text-md text-neutral-500 hover:text-rose-500 transition-colors"
            >
              Dont have an account? Signup
            </Link>
            <SocialAuthButtons />
          </form>
        </div>
      </div>
    </div>
  );
}
