import React from "react";
import { Button } from "./ui/button";
import { BsSend } from "react-icons/bs";

const Banner = () => {
  return (
    <div className="my-6 border bg-gradient-to-r from-pink-700  to-pink-400 border-pink-500  flex items-center justify-center flex-col p-4 rounded-xl  text-white">
      <h1 className="text-4xl">Struggling to find any product?</h1>
      <p className="my-1">Don&apos;t worry, we got you covered.</p>
      <Button className="my-2 bg-white text-pink-800 hover:bg-gray-100 ">
        <a
          href="mailto:authorisedaman@gmail.com"
          className="flex items-center justify-center gap-2 "
        >
          {" "}
          <BsSend className="animate-pulse" />
          Mail Us
        </a>
      </Button>
    </div>
  );
};

export default Banner;
