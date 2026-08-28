"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/store";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdArrowRightAlt } from "react-icons/md";

export default function SignupPage() {
  const { setUser, fetchUserCart } = useAuthStore();
  const router = useRouter();
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
      setUser(response.data.data);
      fetchUserCart();

      router.push("/");
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
    <div className="flex items-center justify-center gap-4 min-h-[70vh] flex-col bg-white text-black w-full">
      {/* <Image
        src="/girly3.png"
        alt="logo"
        width={100}
        height={100}
        className=""
      /> */}
      <h1 className="text-3xl font-bold">Sign Up</h1>
      <p className="text-center w-full mx-2 text-sm md:text-md">
        Welcome, Create account to get started.
      </p>

      <form
        className=" flex items-center justify-center gap-2 flex-col w-[80%] md:w-[50%] lg:w-[30%]"
        onSubmit={signupHandler}
      >
        <Input
          type="text"
          placeholder="Full name"
          name="name"
          className="w-full"
          value={data.name}
          onChange={changeHandler}
        />
        <Input
          type="email"
          placeholder="Email"
          name="email"
          className="w-full"
          value={data.email}
          onChange={changeHandler}
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
        <Button
          disabled={loading}
          type="submit"
          className="bg-black text-white w-full cursor-pointer"
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
          <div className="text-red-500 font-light text-sm">{signupError}</div>
        )}
        <Link href="/login " className="text-sm md:text-md">
          Already have an account? Login
        </Link>
      </form>
    </div>
  );
}
