import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  onUpdate: (id: string, name: string) => void;
}

interface Category {
  _id: string;
  name: string;
  categoryImage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onUpdate,
}) => {
  const [newName, setNewName] = useState(category?.name || "");

  React.useEffect(() => {
    if (category?.name) {
      setNewName(category.name);
    }
  }, [category]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    if (!newName) return;
    onUpdate(category._id, newName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60  bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-[90%] md:w-1/3">
        <h2 className="text-lg font-semibold text-center">Edit Category</h2>
        <div className="mt-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border w-full p-2 rounded"
          />
        </div>
        <div className="flex justify-between gap-4 mt-4 w-full">
          <Button
            onClick={onClose}
            variant="secondary"
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} className="cursor-pointer bg-black">
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;
