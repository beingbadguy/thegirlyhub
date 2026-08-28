"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/store";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdArrowRightAlt } from "react-icons/md";

export default function LoginPage() {
  const { setUser, fetchUserCart } = useAuthStore();
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
      setUser(response.data.data); // Update  user state with the returned user object
      fetchUserCart();
      router.push("/"); // Redirect to home page after successful login
      // if (await response.data.data.isVerified) {
      // } else {
      //   router.push("/verify"); // Redirect to home page after successful login
      // }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        setLoginError(error.response?.data.message);
      } else {
        console.error("An unknown error occurred:", error);
        setLoginError("An unknown error occured, try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center gap-4 min-h-[70vh] flex-col bg-white text-black w-full">
      {/* <Image
        src="/girly3.png"
        alt="logo"
        width={100}
        height={100}
        className=""
      /> */}
      <h1 className="text-3xl font-bold">Log In</h1>
      <p className="text-center w-full text-sm md:text-md">
        Welcome back, Log In to start shopping.
      </p>

      <form
        className=" flex items-center justify-center gap-2 flex-col w-[80%] md:w-[50%] lg:w-[30%]"
        onSubmit={loginHandler}
      >
        <Input
          type="email"
          placeholder="Email"
          name="email"
          value={data.email}
          onChange={changeHandler}
          className="w-full"
        />

        <div className="relative w-full">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            name="password"
            className="w-full"
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

        <Link href={"/forget"} className="w-full text-right text-sm">
          Forget Password
        </Link>
        <Button
          disabled={loading}
          type="submit"
          className="bg-black text-white w-full  cursor-pointer"
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
          <div className="text-red-500 font-light text-sm">{loginError}</div>
        )}
        <Link href="/signup" className="text-sm md:text-md">
          Dont have an account? Signup
        </Link>
      </form>
    </div>
  );
}
