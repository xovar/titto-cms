import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Tag, Search, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify'; // ⚡ Toastify import করা হলো
import {
  fetchCategories,
  addCategory,
  deleteCategory,
} from '../../store/slices/productSlice';

export default function Categories() {
  const dispatch = useDispatch();

  // ⚡ স্লাইসের আর্কিটেকচার অনুযায়ী স্টেট
  const { categories, loading } = useSelector((state) => state.products);
  const isCategoryLoading = loading?.categories;

  // Safe fallback array
  const categoriesList = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🗑️ মডালের স্টেট
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // 🔍 নাম এবং taxonomy ID দিয়ে ক্যাটাগরি ফিল্টারিং
  const filteredCategories = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return categoriesList;

    return categoriesList.filter((c) => {
      const catName = c?.name?.toLowerCase() || '';
      const catId = String(c?.id || c?._id || '').toLowerCase();
      return catName.includes(searchTerm) || catId.includes(searchTerm);
    });
  }, [categoriesList, search]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Category name cannot be empty!'); // 🚀 Toast message
      return;
    }

    // Safe duplicate check
    if (categoriesList.some((c) => c?.name?.toLowerCase() === trimmedName.toLowerCase())) {
      toast.warning('Category already exists!'); // 🚀 Toast message
      return;
    }

    setIsSubmitting(true);
    dispatch(addCategory({ name: trimmedName }))
      .unwrap()
      .then(() => {
        toast.success(`Category "${trimmedName}" added successfully!`); // 🚀 Toast message
        setName('');
        // ⚡ নতুন ক্যাটাগরি তৈরির পর ব্যাকএন্ড থেকে জেনারেট হওয়া আইডি সহ ডেটা রিফেচ
        dispatch(fetchCategories());
      })
      .catch((err) => {
        toast.error(err || 'Failed to add category'); // 🚀 Toast message
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // 🗑️ ডিলিট মডাল ওপেন
  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  // 🗑️ ডিলিট মডাল ক্লোজ
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  // 🗑️ কনফার্ম ডিলিট অ্যাকশন
  const handleConfirmDelete = () => {
    const categoryId = selectedCategory?.id || selectedCategory?._id;
    if (!categoryId) return;

    setIsDeleting(true);
    dispatch(deleteCategory(categoryId))
      .unwrap()
      .then(() => {
        toast.success(`Category "${selectedCategory?.name}" deleted successfully!`); // 🚀 Toast message
        closeDeleteModal();
      })
      .catch((err) => {
        toast.error(err || 'Failed to delete category'); // 🚀 Toast message
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <div className="space-y-6" id="categories-view">
      <div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
          Product Categories
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Manage system-wide taxonomies for cataloging products.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Split Panel - Form */}
        <div className="md:col-span-2">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Create Category
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Running Shoes"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Add Category
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Split Panel - Table & Search */}
        <div className="md:col-span-3">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Categories List
              </h3>

              {/* 🔍 সার্চ ইনপুট */}
              <div className="relative w-full sm:w-48">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
                  size={14}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category..."
                  className="input-field pl-8 text-xs py-1.5"
                />
              </div>
            </div>

            {/* ⚡ স্ক্রলেবল কনটেইনার */}
            <div className="max-h-[320px] overflow-y-auto overflow-x-auto relative">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-background-light dark:bg-background-dark z-10">
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                      Taxonomy ID
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {isCategoryLoading && categoriesList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          <div className="w-6 h-6 border-2 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading categories...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((c) => {
                      const categoryId = c?.id || c?._id;
                      return (
                        <tr
                          key={categoryId || c?.name}
                          className="hover:bg-background-light dark:hover:bg-background-dark/35 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark">
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-accent-brand shrink-0" />
                              <span>{c?.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                            {categoryId || 'Generating...'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openDeleteModal(c)}
                              className="text-text-secondary-light cursor-pointer hover:text-accent-danger p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {filteredCategories.length === 0 && !isCategoryLoading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark"
                      >
                        {search ? 'No matching categories found.' : 'No categories found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 🗑️ Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-md p-6 relative shadow-2xl border border-border-light dark:border-border-dark animate-scaleIn">
            <button
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark disabled:opacity-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-accent-danger rounded-full shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Delete Category
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">"{selectedCategory?.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Selected Item Preview Box */}
            {selectedCategory && (
              <div className="mt-4 p-3 bg-background-light dark:bg-background-dark/50 rounded-lg border border-border-light dark:border-border-dark flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-accent-brand shrink-0" />
                  <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    {selectedCategory.name}
                  </span>
                </div>
                <span className="font-mono text-text-secondary-light dark:text-text-secondary-dark">
                  {selectedCategory.id || selectedCategory._id}
                </span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 cursor-pointer text-xs font-medium border border-border-light dark:border-border-dark rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 cursor-pointer text-xs font-medium bg-accent-danger hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}