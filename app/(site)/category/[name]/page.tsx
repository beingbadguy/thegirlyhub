"use client";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import axios, { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import { Heart, Sparkles } from "lucide-react";

type Product = React.ComponentProps<typeof ProductCard>["product"];

const Page = () => {
  const { name } = useParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const categoryName = decodeURIComponent(name as string);

  const fetchProducts = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/product", {
        params: { page: pageNum, limit: 12, category: categoryName },
      });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination?.totalPages ?? 1);
      setTotal(response.data.pagination?.total ?? 0);
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

  useEffect(() => {
    setPage(1);
  }, [name]);

  useEffect(() => {
    fetchProducts(page);
    window.scrollTo(0, 0);
  }, [name, page]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <VscLoading className="animate-spin text-2xl text-pink-700" />
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] p-4">
      <div className="mb-4 text-sm text-gray-500">
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/")}
        >
          Home
        </span>{" "}
        /{" "}
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/category")}
        >
          Categories
        </span>{" "}
        / <span className="text-black">{categoryName}</span>
      </div>

      {products.length === 0 ? (
        <div className="relative mx-auto mt-8 flex min-h-[430px] max-w-3xl items-center justify-center overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-12 text-center shadow-[0_20px_60px_-35px_rgba(190,24,93,0.45)]">
          <div className="absolute -left-8 -top-8 size-32 rounded-full bg-rose-200/45 blur-2xl" />
          <div className="absolute -bottom-10 -right-6 size-40 rounded-full bg-amber-200/50 blur-2xl" />
          <Sparkles className="absolute left-[12%] top-14 size-5 text-rose-300" />
          <Sparkles className="absolute bottom-16 right-[13%] size-4 text-amber-400" />

          <div className="relative flex max-w-md flex-col items-center">
            <div className="relative mb-6 grid size-24 place-items-center rounded-full border-4 border-white bg-rose-100 shadow-lg shadow-rose-200/60">
              <Heart className="size-10 fill-rose-500 text-rose-500" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-400">
              A little sparkle is on its way
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-rose-950 sm:text-4xl">
              Nothing here yet
            </h1>
            <p className="mt-3 text-sm leading-6 text-rose-900/65 sm:text-base">
              We have not added any pieces to {categoryName} just yet. Explore
              our other lovely finds instead.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/product")}
                className="rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-800"
              >
                Continue shopping
              </button>
              <button
                type="button"
                onClick={() => router.push("/category")}
                className="rounded-full border border-rose-200 bg-white/80 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Browse categories
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm">
            {total} product{total !== 1 ? "s" : ""} in {categoryName}
          </div>
          <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
};

export default Page;
