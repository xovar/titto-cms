import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Pencil, Trash2, Eye, Tag, ShoppingBag } from 'lucide-react';
import { fetchProducts, deleteProduct } from '../../store/slices/productSlice';

function ProductCard({ product, onDelete }) {
  // ⚡ প্রথম ভ্যারিয়েন্টকে ডিফল্ট একটিভ ভ্যারিয়েন্ট হিসেবে সেট করছি
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // একটিভ ভ্যারিয়েন্ট অনুযায়ী ইমেজ লোড হবে
  const currentVariant = product.variants?.[activeVariantIndex];
  const images = currentVariant?.images || [];
  const currentImage = images[imageIndex] || '';

  // মোট স্টক ক্যালকুলেশন (সব ভ্যারিয়েন্ট মিলিয়ে)
  const totalStock = product.variants?.reduce(
    (sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0), 0
  ) || 0;

  // ডিসকাউন্ট প্রাইস হিসাব
  const discountedPrice = product.discount
    ? (parseFloat(product.price) * (1 - parseFloat(product.discount) / 100)).toFixed(0)
    : product.price;

  // যখন কালার চেঞ্জ হবে তখন ইমেজ ইনডেক্স রিসেট করার জন্য
  const handleVariantChange = (index) => {
    setActiveVariantIndex(index);
    setImageIndex(0); 
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
          <div className="absolute top-3 left-3 bg-accent-danger text-white text-xs font-semibold px-2.5 py-1 rounded-full">
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
            className="p-2 rounded-lg bg-surface-light dark:bg-surface-dark shadow-md hover:bg-accent-brand hover:text-white text-text-secondary-light dark:text-text-secondary-dark transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 rounded-lg bg-surface-light dark:bg-surface-dark shadow-md hover:bg-accent-danger hover:text-white text-text-secondary-light dark:text-text-secondary-dark transition-colors"
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
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{product.category?.name}</span>
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
                key={v.id}
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

        {/* Views / Sold */}
        <div className="flex items-center gap-4 text-xs text-text-secondary-light dark:text-text-secondary-dark pt-1 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{product.viewed} views</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingBag size={12} />
            <span>{product.sold} sold</span>
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
            <button onClick={() => setShowConfirm(false)} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button
              onClick={() => { onDelete(product.id); setShowConfirm(false); }}
              className="btn-primary text-xs px-4 py-2 bg-accent-danger! hover:bg-red-600!"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductList() {
  const dispatch = useDispatch();
  
  // ⚡ স্লাইসের আপডেটেড স্ট্রাকচার অনুযায়ী স্টেট ডেস্ট্রাকচারিং করা হলো
  const items = useSelector((state) => state.products.items);
  const isProductLoading = useSelector((state) => state.products.loading.products);

  console.log(items);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteProduct(id));
  };

  // ⚡ লোডিং ট্র্যাকিং-এ নতুন `isProductLoading` ভেরিয়েবল ব্যবহার করা হয়েছে
  if (isProductLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="product-list-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Products
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            {items.length} products in catalog
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} onDelete={handleDelete} />
        ))}
      </div>

      {items.length === 0 && !isProductLoading && (
        <div className="card p-12 text-center">
          <ShoppingBag size={48} className="mx-auto text-text-secondary-light/30 dark:text-text-secondary-dark/30 mb-4" />
          <p className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
            No products yet
          </p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Add your first product to get started.
          </p>
        </div>
      )}
    </div>
  );
}