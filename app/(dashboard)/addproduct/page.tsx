"use client";
import { ChevronLeft, ImageIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios, { AxiosError } from "axios";

import Image from "next/image";
import { CgClose } from "react-icons/cg";
import { useRouter } from "next/navigation";

const initialFormData = {
  title: "",
  description: "",
  price: "",
  discountedPrice: "",
  countInStock: "",
  info: "",
};

interface Category {
  _id: string;
  name: string;
  categoryImage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const Page = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [data, setData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageLink, setImageLink] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const router = useRouter();

  // console.log(data);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category", {
        params: { page: 1, limit: 12 },
      });
      // console.log(response.data);
      setCategories(response.data.categories);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("An unknown error occurred:", error);
      }
    } finally {
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError("Please select a category");
      return;
    }
    if (
      !data.title.trim() ||
      !data.description.trim() ||
      !data.price.trim() ||
      !data.discountedPrice.trim() ||
      !data.countInStock.trim() ||
      !data.info.trim()
    ) {
      setError("Please fill all the fields");
      return;
    }
    if (!imageLink) {
      setError("Please upload an image");
      return;
    }
    const price = Number(data.price);
    const discountedPrice = Number(data.discountedPrice);
    const countInStock = Number(data.countInStock);
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(discountedPrice) ||
      discountedPrice < 0 ||
      !Number.isFinite(countInStock) ||
      countInStock < 0
    ) {
      setError("Enter valid price and stock values");
      return;
    }
    if (price < discountedPrice) {
      setError("Discounted price cannot be greater than price");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("price", String(price));
      formData.append("discountedPrice", String(discountedPrice));
      formData.append("countInStock", String(countInStock));
      formData.append("category", selectedCategory);
      formData.append("info", data.info);
      formData.append("image", imageLink!);

      const response = await axios.post("/api/product", formData);
      // console.log(response.data);
      setSuccess(response.data.message);
      setError("");
      router.push("/products");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
        setError(error.response?.data.message);
      } else {
        console.error("An unknown error occurred:", error);
        setError("An unknown error occurred");
      }
    } finally {
      setData(initialFormData);
      setSelectedCategory("");
      setImageLink(null);
      setPreviewImage(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // if (!user) {
    //   router.push("/login");
    // }
  }, []);

  useEffect(() => {
    if (imageLink) {
      const url = URL.createObjectURL(imageLink);
      setPreviewImage(url);

      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewImage(null);
    }
  }, [imageLink]);
  return (
    <div className="pt-20 pb-20 md:pt-0 md:mb-0 overflow-y-scroll max-h-[90vh]">
      <div className="mt-2 cursor-pointer flex items-center gap-2 ">
        <Link href={"/products"}>
          {" "}
          <ChevronLeft />
        </Link>
        <h1 className="font-bold text-2xl text-pink-700">Add Product</h1>
      </div>
      <div className="mt-4">
        <form
          onSubmit={handleSubmit}
          className="w-full mt-6 space-y-4 p-4 bg-white rounded-xl "
        >
          <Input
            name="title"
            placeholder="Title"
            value={data.title}
            onChange={handleChange}
            required
          />
          <Textarea
            name="description"
            placeholder="Description"
            value={data.description}
            onChange={handleChange}
            required
          />
          <div className="flex items-start justify-between">
            {previewImage ? (
              <div className="relative">
                <Image
                  src={previewImage}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="mt-2 rounded"
                />
                <CgClose
                  className="bg-white text-black cursor-pointer hover:scale-50 absolute top-4 right-4 size-4  rounded-full"
                  onClick={() => {
                    setImageLink(null);
                  }}
                />
              </div>
            ) : (
              <div className="relative border-dashed border-2 border-gray-300 size-28 overflow-hidden cursor-pointer">
                <Input
                  name="image"
                  type="file"
                  accept="image/*"
                  placeholder="Image URL"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageLink(file);
                  }}
                  className="size-72 opacity-0 z-[999] cursor-pointer"
                  required
                />
                <ImageIcon className="top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-0 text-gray-300" />
              </div>
            )}
          </div>

          <select
            name=""
            id=""
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border"
          >
            <option value="">Select Category</option>

            {categories &&
              categories.map((cat) => (
                <option value={cat.name} key={cat._id}>
                  {cat.name}
                </option>
              ))}
          </select>
          <div></div>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              name="price"
              placeholder="Price"
              value={data.price}
              onChange={handleChange}
              required
            />
            <Input
              type="number"
              name="discountedPrice"
              placeholder="Discounted Price"
              value={data.discountedPrice}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            type="number"
            name="countInStock"
            placeholder="Count In Stock"
            value={data.countInStock}
            onChange={handleChange}
            required
          />

          <Textarea
            name="info"
            placeholder="Long Description"
            value={data.info}
            onChange={handleChange}
            required
          />

          <div className="flex items-center gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </span>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} /> Product added successfully!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={20} /> {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
