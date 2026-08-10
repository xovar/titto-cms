import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Eye, Tag, ShoppingBag, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { toast } from "react-toastify";
import { fetchProducts, deleteProduct, fetchCategories, fetchBrands } from '../../store/slices/productSlice';

function ProductCard({ product, onDelete }) {
  const navigate = useNavigate();

  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentVariant = product.variants?.[activeVariantIndex];
  const images = currentVariant?.images || [];
  const currentImage = images[imageIndex] || '';

  // ⚡ একই সাইজের একাধিক ডাটা থাকলে সেগুলোকে গ্রুপ এবং স্টক যোগ করার লজিক
  const mergedSizes = useMemo(() => {
    if (!currentVariant?.sizes || currentVariant.sizes.length === 0) return [];
    
    const sizeMap = new Map();

    currentVariant.sizes.forEach((s) => {
      const sizeKey = String(s.size || s.name || '').trim();
      if (!sizeKey) return;

      if (sizeMap.has(sizeKey)) {
        const existing = sizeMap.get(sizeKey);
        existing.stock += Number(s.stock || 0);
      } else {
        sizeMap.set(sizeKey, {
          id: s.id || sizeKey,
          size: sizeKey,
          stock: Number(s.stock || 0),
        });
      }
    });

    return Array.from(sizeMap.values());
  }, [currentVariant]);

  const totalStock = product.variants?.reduce(
    (sum, v) => sum + (v.sizes?.reduce((s, sz) => s + (sz.stock || 0), 0) || 0), 0
  ) || 0;

  const discountedPrice = product.discount
    ? (parseFloat(product.price) * (1 - parseFloat(product.discount) / 100)).toFixed(0)
    : product.price;

  const handleVariantChange = (index) => {
    setActiveVariantIndex(index);
    setImageIndex(0); 
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(product.id, product.name);
    setIsDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className="card card-hover group relative overflow-hidden" id={`product-${product.id}`}>
      {/* Image Section */}
      <div className="relative aspect-4/3 overflow-hidden bg-background-light dark:bg-background-dark">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={40} className="text-text-secondary-light/30 dark:text-text-secondary-dark/30" />
          </div>
        )}

        {/* Discount badge */}
        {parseFloat(product.discount) > 0 && (
          <div className="absolute top-3 left-3 bg-accent-danger text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
            -{product.discount}%
          </div>
        )}

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setImageIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === imageIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Action overlay */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={() => navigate(`/products/edit/${product.id}`)}
            className="p-2 cursor-pointer rounded-lg bg-surface-light dark:bg-surface-dark shadow-md hover:bg-accent-brand hover:text-white text-text-secondary-light dark:text-text-secondary-dark transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 cursor-pointer rounded-lg bg-surface-light dark:bg-surface-dark shadow-md hover:bg-accent-danger hover:text-white text-text-secondary-light dark:text-text-secondary-dark transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {product.brand?.name && (
              <>
                <span className="text-xs font-medium text-accent-brand">{product.brand.name}</span>
                <span className="text-text-secondary-light/30 dark:text-text-secondary-dark/30">•</span>
              </>
            )}
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{product.category?.name || 'Uncategorized'}</span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark leading-snug line-clamp-1">
            {product.name}
          </h3>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              ৳{discountedPrice}
            </span>
            {parseFloat(product.discount) > 0 && (
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-through">
                ৳{product.price}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            <Tag size={12} />
            <span>{totalStock} in stock</span>
          </div>
        </div>

        {/* Color swatches */}
        {product.variants?.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.variants.map((v, index) => (
              <button
                key={v.id || index}
                onClick={() => handleVariantChange(index)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  index === activeVariantIndex 
                    ? 'border-accent-brand scale-110 shadow-sm' 
                    : 'border-border-light dark:border-border-dark hover:scale-105'
                }`}
                style={{ backgroundColor: v.color?.code || '#888' }}
                title={v.color?.name}
              />
            ))}
          </div>
        )}

        {/* ⚡ Size Badges (Aggregated) */}
        {mergedSizes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {mergedSizes.map((s, idx) => {
              const isOutOfStock = s.stock === 0;
              const isLowStock = s.stock > 0 && s.stock <= 3;

              return (
                <span
                  key={s.id || idx}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                    isOutOfStock
                      ? 'bg-red-500/10 text-red-500 border-red-500/30 line-through opacity-70'
                      : isLowStock
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border-border-light dark:border-border-dark'
                  }`}
                  title={
                    isOutOfStock
                      ? 'Out of stock'
                      : isLowStock
                      ? `Low stock! Only ${s.stock} left`
                      : `In stock (${s.stock})`
                  }
                >
                  {s.size}
                  {isLowStock && <span className="ml-1 text-[9px] font-bold">({s.stock})</span>}
                </span>
              );
            })}
          </div>
        )}

        {/* Views / Sold */}
        <div className="flex items-center gap-4 text-xs text-text-secondary-light dark:text-text-secondary-dark pt-1 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{product.viewed || 0} views</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingBag size={12} />
            <span>{product.sold || 0} sold</span>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="absolute inset-0 bg-surface-light/95 dark:bg-surface-dark/95 flex flex-col items-center justify-center gap-4 z-20 p-6 animate-fade-in">
          <Trash2 size={28} className="text-accent-danger" />
          <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark text-center">
            Delete this product?
          </p>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
            This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowConfirm(false)} 
              disabled={isDeleting}
              className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="btn-primary text-xs px-4 py-2 bg-accent-danger hover:bg-red-600 border-none flex items-center gap-1 disabled:opacity-70"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const items = useSelector((state) => state.products.items || []);
  const categories = useSelector((state) => state.products.categories || []);
  const brands = useSelector((state) => state.products.brands || []);
  const isProductLoading = useSelector((state) => state.products.loading?.products);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  const handleDelete = async (id, name) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success(`Product "${name || ''}" deleted successfully!`);
    } catch (err) {
      toast.error(err || 'Failed to delete product');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  const filteredProducts = useMemo(() => {
    return items
      .filter((product) => {
        const matchesSearch =
          product.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          product.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase().trim());

        const matchesCategory =
          selectedCategory === 'all' ||
          String(product.category?.id || product.category?._id) === String(selectedCategory);

        const matchesBrand =
          selectedBrand === 'all' ||
          String(product.brand?.id || product.brand?._id) === String(selectedBrand);

        const totalStock = product.variants?.reduce(
          (sum, v) => sum + (v.sizes?.reduce((s, sz) => s + (sz.stock || 0), 0) || 0), 0
        ) || 0;

        let matchesStock = true;
        if (stockFilter === 'in_stock') matchesStock = totalStock > 0;
        if (stockFilter === 'out_of_stock') matchesStock = totalStock === 0;

        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
      })
      .sort((a, b) => {
        const getPrice = (p) => p.discount ? parseFloat(p.price) * (1 - parseFloat(p.discount) / 100) : parseFloat(p.price);

        if (sortBy === 'price_low') return getPrice(a) - getPrice(b);
        if (sortBy === 'price_high') return getPrice(b) - getPrice(a);
        return 0;
      });
  }, [items, searchTerm, selectedCategory, selectedBrand, stockFilter, sortBy]);

  if (isProductLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-accent-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="product-list-view">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Products
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Showing {filteredProducts.length} of {items.length} products
          </p>
        </div>

        <button
          onClick={() => navigate('/products/add')}
          className="btn-primary flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" size={16} />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 text-xs py-2 w-full"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field text-xs py-2 w-full cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="input-field text-xs py-2 w-full cursor-pointer"
            >
              <option value="all">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id || brand._id} value={brand.id || brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="input-field text-xs py-2 w-full cursor-pointer"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-xs py-2 w-full cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedCategory !== 'all' || selectedBrand !== 'all' || stockFilter !== 'all' || sortBy !== 'newest') && (
          <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark text-xs">
            <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
              <Filter size={12} /> Active filters applied
            </span>
            <button
              onClick={handleResetFilters}
              className="text-accent-brand hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw size={12} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id || product._id} product={product} onDelete={handleDelete} />
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && !isProductLoading && (
        <div className="card p-12 text-center">
          <ShoppingBag size={48} className="mx-auto text-text-secondary-light/30 dark:text-text-secondary-dark/30 mb-4" />
          <p className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
            No products found
          </p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 mb-4">
            {items.length === 0 ? "Add your first product to get started." : "Try adjusting your search or filter parameters."}
          </p>
          {items.length === 0 ? (
            <button
              onClick={() => navigate('/products/add')}
              className="btn-primary inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Product
            </button>
          ) : (
            <button
              onClick={handleResetFilters}
              className="btn-secondary inline-flex items-center gap-2 cursor-pointer text-xs"
            >
              <RefreshCw size={14} /> Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}