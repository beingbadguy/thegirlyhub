import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IoIosCheckmarkCircle } from "react-icons/io";
import FloralAccent from "@/components/decorations/FloralAccent";

export default async function page() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center mx-2 relative overflow-hidden">
      <div className="pointer-events-none absolute top-10 right-10 opacity-40 sm:opacity-70">
        <FloralAccent flower={1} size="lg" variant="float" />
      </div>
      <div className="pointer-events-none absolute bottom-10 left-10 opacity-30 sm:opacity-60">
        <FloralAccent flower={2} size="lg" variant="float-delayed" />
      </div>

      <div className="flex items-center justify-center gap-3 flex-col relative z-10 bg-white p-8 rounded-3xl border border-rose-100/80 shadow-sm max-w-md w-full text-center">
        <div className="relative mb-2">
          <FloralAccent flower={2} size="md" variant="sway" />
        </div>
        <span className="flex items-center justify-center">
          <IoIosCheckmarkCircle className="size-16 text-emerald-500" />
        </span>
        <h1 className="text-xl font-bold text-gray-900 font-serif">Password Changed!</h1>
        <p className="text-sm text-gray-600">Your password has been changed successfully ✨</p>
        <Link href="/login" className="cursor-pointer w-full mt-2">
          <Button className="cursor-pointer w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl">Login Now</Button>
        </Link>
      </div>
    </div>
  );
}
