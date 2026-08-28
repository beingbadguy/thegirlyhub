import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center  flex-col">
      <h1 className="text-[108px]">404</h1>
      <p className="font-bold text-pink-700 text-2xl">Page Not Found</p>
      <p className="my-4 w-full text-center mx-6">
        The page you&apos;re looking for doesn&apos;t seem to exist.
      </p>
      <div>
        <Button className="bg-pink-700 hover:bg-pink-600 active:scale-90 transition-transform duration-300 ">
          <Link href={"/"}>Go back</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
