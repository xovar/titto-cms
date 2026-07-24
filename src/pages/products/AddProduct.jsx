import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import axios from "axios";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  fetchCategories,
  fetchBrands,
  fetchColors,
  addProduct,
} from "../../store/slices/productSlice";

export default function AddProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories, brands, colors, loading } = useSelector(
    (state) => state.products,
  );
  const isSubmitting = loading?.products || false;

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");

  // Initial variant state
  const [variants, setVariants] = useState([
    {
      colorId: "",
      images: [],
      sizes: [{ size: "", stock: 0 }],
    },
  ]);

  const [validationError, setValidationError] = useState("");

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    dispatch(fetchColors());
  }, [dispatch]);

  // Set default category and brand IDs once fetched
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      const firstCatId = categories[0].id || categories[0]._id;
      if (firstCatId) setCategoryId(firstCatId);
    }
    if (brands.length > 0 && !brandId) {
      const firstBrandId = brands[0].id || brands[0]._id;
      if (firstBrandId) setBrandId(firstBrandId);
    }
  }, [categories, brands, categoryId, brandId]);

  // Set default color ID for the first variant
  useEffect(() => {
    if (colors.length > 0 && variants[0].colorId === "") {
      const firstColorId = colors[0].id || colors[0]._id;
      if (firstColorId) {
        setVariants([
          {
            colorId: firstColorId,
            images: [],
            sizes: [{ size: "", stock: 0 }],
          },
        ]);
      }
    }
  }, [colors]);

  const handleAddVariant = () => {
    const defaultColorId = colors[0]?.id || colors[0]?._id || "";
    setVariants([
      ...variants,
      {
        colorId: defaultColorId,
        images: [],
        sizes: [{ size: "", stock: 0 }],
      },
    ]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (varIdx, field, val) => {
    const updated = [...variants];
    updated[varIdx][field] = val;
    setVariants(updated);
  };

  // ফ্রন্ট-এন্ড ইমেজ কম্প্রেশন ও আপলোড ফাংশন
  const handleImageUpload = async (varIdx, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const formData = new FormData();

    try {
      // ১. ফাইল কমপ্রেস করা এবং সঠিক নামসহ Blob কে File-এ রূপান্তর
      for (let file of files) {
        const compressedBlob = await imageCompression(file, options);
        const fileName = file.name || `image_${Date.now()}.jpg`;
        const compressedFile = new File([compressedBlob], fileName, {
          type: compressedBlob.type,
        });

        formData.append("images", compressedFile);
      }

      // ২. এপিআই কল
      const response = await axios.post(
        "https://api.titto.com.bd/api/upload/upload-images",
        formData
      );

      // ৩. ব্যাকএন্ডের রেসপন্স অনুযায়ী সঠিক কী (key) ধরা
      const uploadedUrls =
        response.data.urls || response.data.imageUrls || response.data.images;

      // ৪. স্টেট আপডেট করা
      const updatedVariants = [...variants];
      const currentImages = [...updatedVariants[varIdx].images];

      if (Array.isArray(uploadedUrls)) {
        uploadedUrls.forEach((url) => {
          if (!currentImages.includes(url)) {
            currentImages.push(url);
          }
        });
      }

      updatedVariants[varIdx].images = currentImages;
      setVariants(updatedVariants);
      setValidationError(""); // সফলতা দেখালে এরর তুলে দেওয়া
    } catch (error) {
      console.error("Image upload failed:", error);
      const serverMsg =
        error.response?.data?.message ||
        "Failed to upload images. Please try again.";
      setValidationError(serverMsg);
    }
  };

  // 💡 আপডেটেড: সার্ভার এবং UI থেকে ইমেজ মুছে ফেলার ফাংশন
  const handleRemoveImage = async (varIdx, imgIdx) => {
    const updated = [...variants];
    const imageUrlToRemove = updated[varIdx].images[imgIdx];

    try {
      // ১. ব্যাকএন্ডে ডিলিট রিকোয়েস্ট পাঠানো
      await axios.post("https://api.titto.com.bd/api/upload/delete-image", {
        imageUrl: imageUrlToRemove,
      });

      // ২. সফলভাবে ডিলিট হলে UI (স্টেট) থেকে রিমুভ করা
      updated[varIdx].images = updated[varIdx].images.filter(
        (_, i) => i !== imgIdx,
      );
      setVariants(updated);
      setValidationError("");
    } catch (error) {
      console.error("Failed to delete image from server:", error);
      const serverMsg =
        error.response?.data?.message ||
        "Failed to delete image from server. Removing from view.";
      setValidationError(serverMsg);

      // কোনো কারণে সার্ভারে এরর দিলেও UI থেকে সরিয়ে দেওয়ার সেফটি ফলব্যাক
      updated[varIdx].images = updated[varIdx].images.filter(
        (_, i) => i !== imgIdx,
      );
      setVariants(updated);
    }
  };

  const handleAddSize = (varIdx) => {
    const updated = [...variants];
    updated[varIdx].sizes.push({ size: "", stock: 0 });
    setVariants(updated);
  };

  const handleRemoveSize = (varIdx, sizeIdx) => {
    const updated = [...variants];
    if (updated[varIdx].sizes.length === 1) return;
    updated[varIdx].sizes = updated[varIdx].sizes.filter(
      (_, i) => i !== sizeIdx,
    );
    setVariants(updated);
  };

  const handleSizeChange = (varIdx, sizeIdx, field, val) => {
    const updated = [...variants];
    updated[varIdx].sizes[sizeIdx][field] = val;
    setVariants(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!name.trim()) return setValidationError("Product name is required");
    if (!price || parseFloat(price) <= 0)
      return setValidationError("Please enter a valid price");
    if (!categoryId) return setValidationError("Please select a category");
    if (!brandId) return setValidationError("Please select a brand");

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.colorId)
        return setValidationError(`Please select a color for variant ${i + 1}`);

      if (v.images.length === 0) {
        return setValidationError(
          `Please upload at least one image for variant ${i + 1}`,
        );
      }

      for (let j = 0; j < v.sizes.length; j++) {
        const s = v.sizes[j];
        if (!s.size.trim()) {
          return setValidationError(
            `Please enter size name for variant ${i + 1}, item ${j + 1}`,
          );
        }
        if (s.stock < 0) {
          return setValidationError(
            `Stock cannot be negative for variant ${i + 1}, item ${j + 1}`,
          );
        }
      }
    }

    const payload = {
      name,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount) || 0,
      category_id: categoryId,
      brand_id: brandId,
      variants: variants.map((v) => ({
        color_id: v.colorId,
        images: v.images,
        sizes: v.sizes.map((s) => ({
          size: s.size,
          stock: parseInt(s.stock) || 0,
        })),
      })),
    };

    dispatch(addProduct(payload))
      .unwrap()
      .then(() => {
        navigate("/products");
      })
      .catch((err) => {
        setValidationError(err || "Failed to create product");
      });
  };

  return (
    <div className="" id="add-product-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 text-xs font-semibold text-accent-brand hover:underline mb-1"
            type="button"
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Add New Product
          </h1>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-sm mt-4">
          {validationError}
        </div>
      )}

      <div className="flex justify-center mt-10">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Basic Metadata */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Basic Metadata
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Viper Element Track Cleats"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed description..."
                      rows={4}
                      className="input-field resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Pricing & Inventory
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input-field"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="input-field"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Relational Taxonomy */}
            <div className="space-y-6">
              <div className="card p-5 space-y-4 h-full">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Relational Taxonomy
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      {categories.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Brand *
                    </label>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="" disabled>
                        Select Brand
                      </option>
                      {brands.map((b) => (
                        <option key={b.id || b._id} value={b.id || b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Option */}
          <div className="card p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Product Variants
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="btn-secondary py-1.5! px-3! text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>

            <div className="space-y-6">
              {variants.map((variant, varIdx) => (
                <div
                  key={varIdx}
                  className="p-5 border border-border-light dark:border-border-dark bg-bg-surface-light dark:bg-bg-surface-dark rounded-xl shadow-xs space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-brand/10 text-accent-brand">
                      Variant #{varIdx + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(varIdx)}
                        className="text-accent-danger hover:text-red-700 p-1.5 rounded-lg hover:bg-accent-danger/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Color Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Color Selector *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={variant.colorId}
                          onChange={(e) =>
                            handleVariantChange(
                              varIdx,
                              "colorId",
                              e.target.value,
                            )
                          }
                          className="select-field"
                          required
                        >
                          <option value="">Select Color</option>
                          {colors.map((c) => (
                            <option key={c.id || c._id} value={c.id || c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {variant.colorId && (
                          <div
                            className="w-10 h-10 rounded-lg border shrink-0 shadow-inner"
                            style={{
                              backgroundColor:
                                colors.find(
                                  (c) => (c.id || c._id) === variant.colorId,
                                )?.code || "#888",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Image Upload Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Upload Variant Images *
                      </label>
                      <div className="relative border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-4 text-center bg-bg-surface-light dark:bg-bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(varIdx, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark">
                          <ImageIcon size={20} />
                          <span className="text-xs font-semibold">
                            Click or drag images to upload
                          </span>
                        </div>
                      </div>

                      {/* Image Preview Grid */}
                      {variant.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {variant.images.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative group aspect-square rounded-md overflow-hidden border border-border-light dark:border-border-dark"
                            >
                              <img
                                src={url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveImage(varIdx, imgIdx)
                                }
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Size & Stock */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Sizes & Stock *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddSize(varIdx)}
                          className="text-accent-brand hover:underline text-xs font-semibold flex items-center gap-0.5"
                        >
                          <Plus size={12} /> Add Size
                        </button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {variant.sizes.map((sz, szIdx) => (
                          <div key={szIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={sz.size}
                              onChange={(e) =>
                                handleSizeChange(
                                  varIdx,
                                  szIdx,
                                  "size",
                                  e.target.value,
                                )
                              }
                              placeholder="Size"
                              className="input-field py-1.5! w-24 shrink-0"
                              required
                            />
                            <input
                              type="number"
                              value={sz.stock}
                              onChange={(e) =>
                                handleSizeChange(
                                  varIdx,
                                  szIdx,
                                  "stock",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              placeholder="Stock"
                              className="input-field py-1.5!"
                              required
                              min="0"
                            />
                            {variant.sizes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSize(varIdx, szIdx)}
                                className="text-text-secondary-light hover:text-accent-danger p-1.5 rounded-md hover:bg-accent-danger/10"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="spinner w-4! h-4! border-2 animate-spin" />
              ) : (
                <>
                  <Save size={16} /> Save Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}