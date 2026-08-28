"use client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import axios, { AxiosError } from "axios";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import PaginationControls from "@/components/PaginationControls";

type Products = {
  _id: string;
  title: string;
  description: string;
  price: number;
  discountedPrice: number;
  countInStock: number;
  sold: number;
  rating: number;
  numReviews: number;
  image: string;
  discountPercentage: number;
  isActive: boolean;
};

const Page = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);

  const [form, setForm] = useState({
    title: "",
    discountedPrice: "",
    countInStock: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAllProducts = async (requestedPage = page) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/product", {
        params: { page: requestedPage, limit: 12 },
      });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("An unknown error occurred:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      await axios.put(`/api/product`, {
        id: id,
        isActive: newStatus,
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: newStatus } : p)),
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Failed to update status", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/product/${id}`);
      fetchAllProducts();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Delete failed", error);
      }
    }
  };

  const openEditModal = (product: Products) => {
    setSelectedProduct(product);
    setForm({
      title: product.title,
      discountedPrice: String(product.discountedPrice),
      countInStock: String(product.countInStock),
    });
    setUpdateModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.discountedPrice || !form.countInStock) {
      setFormError("Please fill all fields.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await axios.put(`/api/product/${selectedProduct?._id}`, {
        title: form.title,
        discountedPrice: Number(form.discountedPrice),
        countInStock: Number(form.countInStock),
      });

      setUpdateModal(false);
      setSelectedProduct(null);
      fetchAllProducts();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Update failed", error);
        setFormError("Failed to update product.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    if (!user) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="mt-2 pt-20 pb-20 md:pt-0 md:mb-0 px-2 md:px-6 overflow-y-scroll max-h-[90vh]">
      <div className="flex items-start justify-start flex-col md:items-center md:justify-between md:flex-row gap-2">
        <h1 className="font-bold text-2xl text-pink-700">
          Products ({products?.length})
        </h1>
        <div className="flex items-center justify-between md:justify-center w-full md:w-auto gap-2 my-2 md:my-0">
          <div className="flex items-center gap-2 px-3 py-[6px] rounded border border-pink-700">
            <Search className="text-pink-700" />
            <input
              type="text"
              placeholder="Shoes"
              className="outline-none w-full"
              onChange={(e) => setQuery(e.target.value)}
              value={query}
            />
          </div>
          <Link href={"/addproduct"}>
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="h-screen flex items-center justify-center w-full">
          <VscLoading className="animate-spin text-3xl text-pink-700" />
        </div>
      ) : (
        <div className="mt-6 w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products
                .filter((product) =>
                  product.title.toLowerCase().includes(query.toLowerCase()),
                )
                .map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={100}
                        height={100}
                        className="w-14 h-14 object-contain z-0 rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.title}
                    </TableCell>
                    <TableCell>
                      ₹{product.discountedPrice}{" "}
                      <span className="line-through text-sm text-gray-500 ml-1">
                        ₹{product.price}
                      </span>
                    </TableCell>
                    <TableCell>{product.countInStock}</TableCell>
                    <TableCell>{product.sold || 0}</TableCell>
                    <TableCell>
                      <Switch
                        className="cursor-pointer"
                        checked={product.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleStatus(product._id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => openEditModal(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          fetchAllProducts(nextPage);
        }}
      />

      {/* Update Modal */}
      {updateModal && selectedProduct && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md">
            <form onSubmit={handleUpdate}>
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-1">Title</p>
                  <Input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <p className="font-medium mb-1">Discount Price</p>
                  <Input
                    type="number"
                    name="discountedPrice"
                    value={form.discountedPrice}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <p className="font-medium mb-1">Stock</p>
                  <Input
                    type="number"
                    name="countInStock"
                    value={form.countInStock}
                    onChange={handleFormChange}
                  />
                </div>
                {formError && (
                  <p className="text-sm text-red-500 font-medium">
                    {formError}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 pt-4">
                  <Button
                    type="submit"
                    className="cursor-pointer flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <VscLoading className="animate-spin h-4 w-4" />
                    )}
                    Update
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUpdateModal(false);
                      setSelectedProduct(null);
                      setFormError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
