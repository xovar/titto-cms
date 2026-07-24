import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Award } from 'lucide-react';
import {
  fetchBrands,
  addBrand,
  deleteBrand,
} from '../../store/slices/productSlice';

export default function Brands() {
  const dispatch = useDispatch();
  
  // ⚡ স্লাইসের স্ট্রাকচার অনুযায়ী loading.brands স্টেটটি নিয়ে আসা হলো
  const { brands, loading } = useSelector((state) => state.products);
  const isBrandLoading = loading?.brands; 

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // বাটন লোডারের জন্য

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Brand name cannot be empty');
      return;
    }

    if (brands.some((b) => b.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('Brand name already exists');
      return;
    }

    setIsSubmitting(true);
    dispatch(addBrand({ name: name.trim() }))
      .unwrap()
      .then(() => {
        setName('');
      })
      .catch((err) => {
        setError(err || 'Failed to add brand');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      dispatch(deleteBrand(id));
    }
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
        {/* Left Split Panel */}
        <div className="md:col-span-2">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Create Brand
            </h3>
            
            {error && (
              <div className="p-3 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-xs">
                {error}
              </div>
            )}

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

              {/* 🔄 ব্র্যান্ড অ্যাড হওয়ার সময় বাটন লোডিং স্টেট */}
              <button 
                type="submit" 
                className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
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

        {/* Right Split Panel */}
        <div className="md:col-span-3">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Brands List
              </h3>
            </div>

            <div className="overflow-x-auto relative min-h-37.5">
              <table className="w-full text-sm">
                <thead>
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
                  {/* ⏳ টেবিল ডেটা লোড হওয়ার সময় সুন্দর কঙ্কাল বা স্পিনার লোডার */}
                  {isBrandLoading && brands.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          <div className="w-6 h-6 border-2 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading brands...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    brands.map((b) => (
                      <tr key={b.id} className="hover:bg-background-light dark:hover:bg-background-dark/35 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark">
                          <div className="flex items-center gap-2">
                            <Award size={14} className="text-accent-brand" />
                            <span>{b.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                          {b.id}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-text-secondary-light hover:text-accent-danger p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete Brand"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {brands.length === 0 && !isBrandLoading && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                        No brands found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}