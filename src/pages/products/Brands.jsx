import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Award, Search, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify'; // ⚡ Toastify import করা হলো
import {
  fetchBrands,
  addBrand,
  deleteBrand,
} from '../../store/slices/productSlice';

export default function Brands() {
  const dispatch = useDispatch();

  // ⚡ স্লাইসের আর্কিটেকচার অনুযায়ী স্টেট
  const { brands, loading } = useSelector((state) => state.products);
  const isBrandLoading = loading?.brands;

  // Safe fallback array
  const brandsList = useMemo(() => (Array.isArray(brands) ? brands : []), [brands]);

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🗑️ মডালের স্টেট
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  // 🔍 নাম এবং taxonomy ID দিয়ে ফিল্টারিং
  const filteredBrands = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return brandsList;

    return brandsList.filter((b) => {
      const brandName = b?.name?.toLowerCase() || '';
      const brandId = String(b?.id || b?._id || '').toLowerCase();
      return brandName.includes(searchTerm) || brandId.includes(searchTerm);
    });
  }, [brandsList, search]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Brand name cannot be empty!'); // 🚀 Toast message
      return;
    }

    // Safe duplicate check
    if (brandsList.some((b) => b?.name?.toLowerCase() === trimmedName.toLowerCase())) {
      toast.warning('Brand name already exists!'); // 🚀 Toast message
      return;
    }

    setIsSubmitting(true);
    dispatch(addBrand({ name: trimmedName }))
      .unwrap()
      .then(() => {
        toast.success(`Brand "${trimmedName}" added successfully!`); // 🚀 Toast message
        setName('');
        // ⚡ নতুন ব্র্যান্ড ক্রিয়েট হওয়ার পর আইডি সাথে সাথে পেতে রিফেচ কল
        dispatch(fetchBrands());
      })
      .catch((err) => {
        toast.error(err || 'Failed to add brand'); // 🚀 Toast message
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // 🗑️ ডিলিট মডাল ওপেন
  const openDeleteModal = (brand) => {
    setSelectedBrand(brand);
    setDeleteModalOpen(true);
  };

  // 🗑️ ডিলিট মডাল ক্লোজ
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setSelectedBrand(null);
  };

  // 🗑️ কনফার্ম ডিলিট অ্যাকশন
  const handleConfirmDelete = () => {
    const brandId = selectedBrand?.id || selectedBrand?._id;
    if (!brandId) return;

    setIsDeleting(true);
    dispatch(deleteBrand(brandId))
      .unwrap()
      .then(() => {
        toast.success(`Brand "${selectedBrand?.name}" deleted successfully!`); // 🚀 Toast message
        closeDeleteModal();
      })
      .catch((err) => {
        toast.error(err || 'Failed to delete brand'); // 🚀 Toast message
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <div className="space-y-6" id="brands-view">
      <div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
          Product Brands
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Manage system-wide manufacturers and product brands.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Split Panel - Form */}
        <div className="md:col-span-2">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Create Brand
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Puma"
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
                    <Plus size={14} /> Add Brand
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
                Brands List
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
                  placeholder="Search brand..."
                  className="input-field pl-8 text-xs py-1.5"
                />
              </div>
            </div>

            {/* ⚡ ৫টির বেশি রো হলে স্ক্রল আসার জন্য max-h-[320px] ও overflow-y-auto */}
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
                  {isBrandLoading && brandsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          <div className="w-6 h-6 border-2 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading brands...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((b) => {
                      const brandId = b?.id || b?._id;
                      return (
                        <tr
                          key={brandId || b?.name}
                          className="hover:bg-background-light dark:hover:bg-background-dark/35 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark">
                            <div className="flex items-center gap-2">
                              <Award size={14} className="text-accent-brand shrink-0" />
                              <span>{b?.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                            {brandId || 'Generating...'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openDeleteModal(b)}
                              className="text-text-secondary-light cursor-pointer hover:text-accent-danger p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Brand"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {filteredBrands.length === 0 && !isBrandLoading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark"
                      >
                        {search ? 'No matching brands found.' : 'No brands found.'}
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
              className="absolute top-4 right-4 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-accent-danger rounded-full shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Delete Brand
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">"{selectedBrand?.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Selected Item Preview Box */}
            {selectedBrand && (
              <div className="mt-4 p-3 bg-background-light dark:bg-background-dark/50 rounded-lg border border-border-light dark:border-border-dark flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-accent-brand shrink-0" />
                  <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                    {selectedBrand.name}
                  </span>
                </div>
                <span className="font-mono text-text-secondary-light dark:text-text-secondary-dark">
                  {selectedBrand.id || selectedBrand._id}
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
                    <Trash2 size={14} /> Delete Brand
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