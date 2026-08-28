"use client";
import { IoCloseOutline } from "react-icons/io5";

interface Category {
  _id: string;
  name: string;
}

type FilterSidebarProps = {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  maxValue: number;
  setMaxValue: (val: number) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  showFilter: boolean;
  setShowFilter: (val: boolean) => void;
  onClear: () => void;
  hideCategory?: boolean; // In case we are already in a specific category page
};

export default function FilterSidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  maxValue,
  setMaxValue,
  sortBy,
  setSortBy,
  showFilter,
  setShowFilter,
  onClear,
  hideCategory = false,
}: FilterSidebarProps) {
  return (
    <>
      {showFilter && (
        <div
          className="fixed inset-0 z-[998] bg-black/50 transition-opacity"
          onClick={() => setShowFilter(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white z-[999] shadow-2xl transition-transform duration-300 flex flex-col ${
          showFilter ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-bold font-serif text-neutral-900">Filters</h3>
          <IoCloseOutline
            className="size-7 cursor-pointer text-neutral-600 hover:text-neutral-900 transition-colors"
            onClick={() => setShowFilter(false)}
          />
        </div>

        <aside className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-none">
          {!hideCategory && categories && categories.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Category
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={selectedCategory === ""}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="accent-pink-600 size-4 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-700 group-hover:text-pink-600 transition-colors">
                    All Categories
                  </span>
                </label>
                {categories.map((category) => (
                  <label key={category._id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      value={category.name}
                      checked={selectedCategory === category.name}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="accent-pink-600 size-4 cursor-pointer"
                    />
                    <span className="text-sm text-neutral-700 group-hover:text-pink-600 transition-colors">
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Max Price
            </h4>
            <div className="px-2">
              <input
                type="range"
                min={0}
                max={100000}
                step={500}
                value={maxValue}
                onChange={(e) => setMaxValue(Number(e.target.value))}
                className="w-full accent-pink-600 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-4 flex items-center justify-between text-sm font-medium">
                <span className="bg-neutral-100 px-3 py-1.5 rounded border text-neutral-600">₹0</span>
                <span className="text-neutral-400">-</span>
                <span className="bg-neutral-100 px-3 py-1.5 rounded border text-neutral-900">₹{maxValue}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Sort By
            </h4>
            <div className="space-y-2">
              {[
                { label: "Default / Newest", value: "default" },
                { label: "Price: Low to High", value: "priceLowToHigh" },
                { label: "Price: High to Low", value: "priceHighToLow" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={sortBy === opt.value}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="accent-pink-600 size-4 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-700 group-hover:text-pink-600 transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="p-4 border-t bg-neutral-50 flex gap-3">
          <button
            className="flex-1 border border-neutral-300 bg-white hover:bg-neutral-100 py-2.5 rounded-lg text-sm font-semibold text-neutral-700 transition-colors cursor-pointer"
            onClick={onClear}
          >
            Reset
          </button>
          <button
            className="flex-1 bg-pink-600 hover:bg-pink-700 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer shadow-sm shadow-pink-200"
            onClick={() => setShowFilter(false)}
          >
            View Results
          </button>
        </div>
      </div>
    </>
  );
}
