import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Palette } from 'lucide-react';
import {
  fetchColors,
  addColor,
  deleteColor,
} from '../../store/slices/productSlice';

export default function Colors() {
  const dispatch = useDispatch();
  
  // ⚡ স্লাইসের আর্কিটেকচার অনুযায়ী loading.colors স্টেট হ্যান্ডেল করা হলো
  const { colors, loading } = useSelector((state) => state.products);
  const isColorLoading = loading?.colors;

  const [name, setName] = useState('');
  const [code, setCode] = useState('#3B82F6');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ফর্ম সাবমিশন লোডার

  useEffect(() => {
    dispatch(fetchColors());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Color name cannot be empty');
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(code)) {
      setError('Please enter a valid Hex code (e.g. #3B82F6)');
      return;
    }

    if (colors.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('Color name already exists');
      return;
    }

    setIsSubmitting(true);
    dispatch(addColor({ name: name.trim(), code: code.toUpperCase() }))
      .unwrap()
      .then(() => {
        setName('');
        setCode('#3B82F6');
      })
      .catch((err) => {
        setError(err || 'Failed to add color');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this color?')) {
      dispatch(deleteColor(id));
    }
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
        {/* Left Split Panel */}
        <div className="md:col-span-2">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Create Color
            </h3>
            
            {error && (
              <div className="p-3 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-xs">
                {error}
              </div>
            )}

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

              {/* 🔄 কালার তৈরি হওয়ার সময় বাটন স্পিনার এবং ডিজেবল স্টেট */}
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
                    <Plus size={14} /> Add Color
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
                Colors List
              </h3>
            </div>

            <div className="overflow-x-auto relative min-h-37.5">
              <table className="w-full text-sm">
                <thead>
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
                  {/* ⏳ সার্ভার থেকে ডেটা লোড হওয়ার সময় লোডিং স্পিনার */}
                  {isColorLoading && colors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          <div className="w-6 h-6 border-2 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading colors...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    colors.map((c) => (
                      <tr key={c.id} className="hover:bg-background-light dark:hover:bg-background-dark/35 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-5 h-5 rounded-full border border-border-light dark:border-border-dark shadow-sm"
                              style={{ backgroundColor: c.code }}
                            />
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-text-primary-light dark:text-text-primary-dark">
                          {c.code}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                          {c.id}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-text-secondary-light hover:text-accent-danger p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete Color"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {colors.length === 0 && !isColorLoading && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                        No colors found.
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