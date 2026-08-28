"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { CgClose } from "react-icons/cg";
import { VscLoading } from "react-icons/vsc";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Page = () => {
  const [name, setName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");
  const router = useRouter();

  const addCategoryHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !categoryImage) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", categoryImage);

      const response = await axios.post("/api/category", formData);
      // console.log(response.data);
      setError(response.data.message);
      router.push("/categories");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
        setError(error.response?.data.message);
      } else {
        console.error("An unknown error occurred:", error);
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
      setName("");
      setCategoryImage(null);
    }
  };

  useEffect(() => {
    if (categoryImage) {
      const previewUrl = URL.createObjectURL(categoryImage);
      setPreviewImageUrl(previewUrl);
      return () => URL.revokeObjectURL(previewUrl); //
    } else {
      setPreviewImageUrl(null);
    }
  }, [categoryImage]);

  useEffect(() => {
    // if (!user) {
    //   router.push("/login");
    // }
  }, []);
  return (
    <div className="pt-20 pb-20 md:pt-0 md:mb-0">
      <div className="mt-2 cursor-pointer flex items-center gap-2 ">
        <Link href={"/categories"}>
          {" "}
          <ChevronLeft />
        </Link>
        <h1 className="font-bold text-2xl text-pink-700">Add Category</h1>
      </div>
      <div className="mt-4">
        <form onSubmit={addCategoryHandle}>
          <Input
            placeholder="Category Name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />

          {previewImageUrl ? (
            <div className="relative">
              <Image
                className="object-cover my-2 rounded-md"
                src={previewImageUrl}
                alt={previewImageUrl}
                width={250}
                height={250}
              />
              <CgClose
                onClick={() => {
                  setPreviewImageUrl(null);
                }}
                className="top-2 left-2 text-black bg-gray-300  rounded-full cursor-pointer absolute"
              />
            </div>
          ) : (
            <div className="border-dashed border-gray-300 border-2 mt-2 w-[20%] h-32 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                className="size-98 opacity-0 z-[999] cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCategoryImage(file);
                }}
              />
              <ImagePlus className="cursor-pointer absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-gray-300 " />
            </div>
          )}
          {error && <div className="mt-2 text-red-500">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            className="my-2 min-w-20 cursor-pointer"
          >
            {loading ? (
              <VscLoading className="animate-spin text-white" />
            ) : (
              "Create"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Page;
