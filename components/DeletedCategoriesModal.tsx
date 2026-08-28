import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import PaginationControls from "./PaginationControls";
import Image from "next/image";

interface DeletedCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

interface Category {
  _id: string;
  name: string;
  categoryImage: string;
  isActive: boolean;
}

const DeletedCategoriesModal: React.FC<DeletedCategoriesModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDeletedCategories = async (pageNum = page) => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const response = await axios.get("/api/category", {
        params: { page: pageNum, limit: 5, deleted: "true" },
      });
      setCategories(response.data.categories || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching deleted categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeletedCategories(1);
      setPage(1);
    }
  }, [isOpen]);

  const handleRestore = async (id: string) => {
    try {
      await axios.put(`/api/category/${id}`, { isDeleted: false });
      alert("Category restored successfully 🎉");
      fetchDeletedCategories(page);
      onRestoreSuccess();
    } catch (error) {
      console.error("Error restoring category:", error);
      alert("Failed to restore category");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Deleted Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-semibold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-pink-500 w-8 h-8 mb-2" />
              <p className="text-gray-500 text-sm">Loading trash...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No deleted categories found.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-3 border border-pink-100 rounded-xl bg-pink-50/30 hover:bg-pink-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={category.categoryImage}
                      alt={category.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-contain w-12 h-12 bg-white border"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(category._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                fetchDeletedCategories(nextPage);
              }}
            />
          </div>
        )}

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-4 py-2 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeletedCategoriesModal;
