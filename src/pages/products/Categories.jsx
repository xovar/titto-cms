import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Tag } from 'lucide-react';
import {
  fetchCategories,
  addCategory,
  deleteCategory,
} from '../../store/slices/productSlice';

export default function Categories() {
  const dispatch = useDispatch();
  
  // ⚡ স্লাইসের আর্কিটেকচার অনুযায়ী loading.categories স্টেট রিড করা হলো
  const { categories, loading } = useSelector((state) => state.products);
  const isCategoryLoading = loading?.categories;

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ফর্ম সাবমিশন লোডার

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }

    setIsSubmitting(true);
    dispatch(addCategory({ name: name.trim() }))
      .unwrap()
      .then(() => {
        setName('');
      })
      .catch((err) => {
        setError(err || 'Failed to add category');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch(deleteCategory(id));
    }
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
        {/* Left Split Panel */}
        <div className="md:col-span-2">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Create Category
            </h3>
            
            {error && (
              <div className="p-3 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-xs">
                {error}
              </div>
            )}

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

              {/* 🔄 ক্যাটাগরি ক্রিয়েট হওয়ার সময় বাটন স্পিনার */}
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
                    <Plus size={14} /> Add Category
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
                Categories List
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
                  {/* ⏳ সার্ভার থেকে প্রথমবার ডেটা আসার সময় সুন্দর টেবিল লোডার */}
                  {isCategoryLoading && categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          <div className="w-6 h-6 border-2 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading categories...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-background-light dark:hover:bg-background-dark/35 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark">
                          <div className="flex items-center gap-2">
                            <Tag size={14} className="text-accent-brand" />
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                          {c.id}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-text-secondary-light hover:text-accent-danger p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}

                  {categories.length === 0 && !isCategoryLoading && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                        No categories found.
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