import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Search, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify'; // ⚡ Toastify import করা হলো
import {
  fetchColors,
  addColor,
  deleteColor,
} from '../../store/slices/productSlice';

export default function Colors() {
  const dispatch = useDispatch();

  // ⚡ স্লাইসের আর্কিটেকচার অনুযায়ী স্টেট
  const { colors, loading } = useSelector((state) => state.products);
  const isColorLoading = loading?.colors;

  // Safe fallback array
  const colorsList = useMemo(() => (Array.isArray(colors) ? colors : []), [colors]);

  const [name, setName] = useState('');
  const [code, setCode] = useState('#3B82F6');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🗑️ মডালের স্টেট
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchColors());
  }, [dispatch]);

  // 🔍 নাম অথবা Hex Code অথবা Taxonomy ID দিয়ে ফিল্টার
  const filteredColors = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return colorsList;

    return colorsList.filter((c) => {
      const colorName = c?.name?.toLowerCase() || '';
      const colorCode = c?.code?.toLowerCase() || '';
      const colorId = String(c?.id || c?._id || '').toLowerCase();
      return (
        colorName.includes(searchTerm) ||
        colorCode.includes(searchTerm) ||
        colorId.includes(searchTerm)
      );
    });
  }, [colorsList, search]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Color name cannot be empty!'); // 🚀 Toast message
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(code)) {
      toast.error('Please enter a valid Hex code (e.g. #3B82F6)'); // 🚀 Toast message
      return;
    }

    // Safe duplication check
    if (colorsList.some((c) => c?.name?.toLowerCase() === trimmedName.toLowerCase())) {
      toast.warning('Color name already exists!'); // 🚀 Toast message
      return;
    }

    setIsSubmitting(true);
    dispatch(addColor({ name: trimmedName, code: code.toUpperCase() }))
      .unwrap()
      .then(() => {
        toast.success(`Color "${trimmedName}" added successfully!`); // 🚀 Toast message
        setName('');
        setCode('#3B82F6');
        // ⚡ নতুন কালার তৈরির সাথে সাথে ডাটাবেজ থেকে আইডি সহ আপডেট পেতে Instant Refetch
        dispatch(fetchColors());
      })
      .catch((err) => {
        toast.error(err || 'Failed to add color'); // 🚀 Toast message
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // 🗑️ ডিলিট মডাল ওপেন
  const openDeleteModal = (color) => {
    setSelectedColor(color);
    setDeleteModalOpen(true);
  };

  // 🗑️ ডিলিট মডাল ক্লোজ
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setSelectedColor(null);
  };

  // 🗑️ কনফার্ম ডিলিট অ্যাকশন
  const handleConfirmDelete = () => {
    const colorId = selectedColor?.id || selectedColor?._id;
    if (!colorId) return;

    setIsDeleting(true);
    dispatch(deleteColor(colorId))
      .unwrap()
      .then(() => {
        toast.success(`Color "${selectedColor?.name}" deleted successfully!`); // 🚀 Toast message
        closeDeleteModal();
      })
      .catch((err) => {
        toast.error(err || 'Failed to delete color'); // 🚀 Toast message
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <div className="space-y-6" id="colors-view">
      <div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
          Product Colors
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Manage variant colors and their matching hexadecimal indicators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Split Panel - Form */}
        <div className="md:col-span-2">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Create Color
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Color Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ocean Blue"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Color Code Hex / Palette *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isSubmitting}
                    className="w-12 h-10 border border-border-light dark:border-border-dark rounded-lg cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="#3B82F6"
                    className="input-field font-mono uppercase"
                    maxLength={7}
                    disabled={isSubmitting}
                    required
                  />
                </div>
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
                    <Plus size={14} /> Add Color
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
                Colors List
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
                  placeholder="Search colors..."
                  className="input-field pl-8 text-xs py-1.5"
                />
              </div>
            </div>

            {/* ⚡ স্ক্রলেবল কনটেইনার */}
            <div className="max-h-80 overflow-y-auto overflow-x-auto relative">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-background-light dark:bg-background-dark z-10">
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                      Color
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                      Hex Code
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
                  {isColorLoading && colorsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          <div className="w-6 h-6 border-2 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading colors...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredColors.map((c) => {
                      const colorId = c?.id || c?._id;
                      return (
                        <tr
                          key={colorId || c?.name}
                          className="hover:bg-background-light dark:hover:bg-background-dark/35 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full border border-border-light dark:border-border-dark shadow-sm shrink-0"
                                style={{ backgroundColor: c?.code }}
                              />
                              <span>{c?.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-text-primary-light dark:text-text-primary-dark">
                            {c?.code}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                            {colorId || 'Generating...'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openDeleteModal(c)}
                              className="text-text-secondary-light cursor-pointer hover:text-accent-danger p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Color"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {filteredColors.length === 0 && !isColorLoading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark"
                      >
                        {search ? 'No matching colors found.' : 'No colors found.'}
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
                  Delete Color
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">"{selectedColor?.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Selected Item Preview Box */}
            {selectedColor && (
              <div className="mt-4 p-3 bg-background-light dark:bg-background-dark/50 rounded-lg border border-border-light dark:border-border-dark flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                    style={{ backgroundColor: selectedColor.code }}
                  />
                  <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    {selectedColor.name}
                  </span>
                </div>
                <span className="font-mono text-text-secondary-light dark:text-text-secondary-dark">
                  {selectedColor.code}
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
                    <Trash2 size={14} /> Delete Color
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