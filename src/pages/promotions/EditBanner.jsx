import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react";

import axiosInstance from "../../api/axiosInstance";

// Banner Slice
import {
  fetchBannerById,
  updateBanner,
  clearSelectedBanner,
} from "../../store/slices/bannerSlice";

// Product Slice
import { fetchProducts } from "../../store/slices/productSlice";

export default function EditBanner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fileInputRef = useRef(null);

  // Redux State
  const { selectedBanner, loading: isBannerLoading } = useSelector(
    (state) => state.banners || {}
  );

  const { items: products = [], loading: productLoading } = useSelector(
    (state) => state.products || {}
  );

  // Form Local State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [placement, setPlacement] = useState("HERO_MAIN_SLIDE");

  // Searchable Dropdown State
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Images State
  const [images, setImages] = useState([]); // Previews (Existing URLs & Blob URLs)
  const [selectedFiles, setSelectedFiles] = useState([]); // Raw File objects for new uploads
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const isCarousel = placement === "HERO_MAIN_SLIDE";

  useEffect(() => {
    if (id) dispatch(fetchBannerById(id));
    if (!products || products.length === 0) dispatch(fetchProducts());

    return () => {
      dispatch(clearSelectedBanner());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (selectedBanner) {
      setTitle(selectedBanner.title || "");
      setSubtitle(selectedBanner.subtitle || "");

      const rawLink = selectedBanner.link || selectedBanner.product_id;
      const targetProductId =
        typeof rawLink === "object" ? rawLink?._id || rawLink?.id : rawLink;
      setLink(targetProductId || "");

      setPlacement(
        selectedBanner.placement || selectedBanner.type || "HERO_MAIN_SLIDE"
      );

      if (Array.isArray(selectedBanner.images)) {
        setImages(selectedBanner.images);
      } else if (selectedBanner.imageUrl || selectedBanner.image) {
        setImages([selectedBanner.imageUrl || selectedBanner.image]);
      } else {
        setImages([]);
      }
    }
  }, [selectedBanner]);

  useEffect(() => {
    if (link && products.length > 0) {
      const selectedProd = products.find(
        (p) => String(p.id || p._id || p.productId) === String(link)
      );
      if (selectedProd) {
        setProductSearch(selectedProd.name || selectedProd.title || "");
      }
    } else if (!link) {
      setProductSearch("");
    }
  }, [link, products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter((prod) => {
    const prodName = (prod.name || prod.title || "").toLowerCase();
    return prodName.includes(productSearch.toLowerCase());
  });

  const handlePlacementChange = (newPlacement) => {
    setPlacement(newPlacement);
    if (newPlacement !== "HERO_MAIN_SLIDE" && images.length > 1) {
      setImages([images[0]]);
      setSelectedFiles((prev) => (prev.length > 0 ? [prev[0]] : []));
    }
  };

  // 🟢 লোকাল প্রিভিউ জেনারেট করা
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadFiles = isCarousel ? files : [files[0]];
    const newPreviews = uploadFiles.map((file) => URL.createObjectURL(file));

    if (isCarousel) {
      setImages((prev) => [...prev, ...newPreviews]);
      setSelectedFiles((prev) => [...prev, ...uploadFiles]);
    } else {
      setImages([newPreviews[0]]);
      setSelectedFiles([uploadFiles[0]]);
    }
    setValidationError("");
  };

  // 🟢 ফ্রন্টএন্ড লিস্ট থেকে ইমেজ সরানো (Save করলে সার্ভার থেকে ডিলিট হয়ে যাবে)
  const handleRemoveImage = (imgIdx) => {
    setImages((prev) => prev.filter((_, idx) => idx !== imgIdx));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== imgIdx));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 🟢 Save Changes (নতুন ফাইল আপলোড + সার্ভারে ব্যানার আপডেট)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) return setValidationError("Banner title is required.");
    if (images.length === 0)
      return setValidationError("Please upload at least one image.");

    try {
      setIsSubmitting(true);
      
      // শুধুমাত্র আগে থেকে থাকা বৈধ URLs (যেসকল ছবিতে blob: নেই)
      const existingUrls = images.filter((img) => !img.startsWith("blob:"));
      let newUploadedUrls = [];

      // নতুন সিলেক্ট করা ছবি থাকলে আপলোড করা
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const formData = new FormData();

        for (let file of selectedFiles) {
          const compressedBlob = await imageCompression(file, options);
          const fileName = file.name || `banner_${Date.now()}.jpg`;
          const compressedFile = new File([compressedBlob], fileName, {
            type: compressedBlob.type,
          });
          formData.append("images", compressedFile);
        }

        const response = await axiosInstance.post(
          "/upload/upload-images",
          formData,
          {
            headers: { "Content-Type": undefined },
          }
        );

        newUploadedUrls =
          response.data?.urls ||
          response.data?.imageUrls ||
          response.data?.images ||
          [];

        setIsUploading(false);
      }

      const finalImageUrls = [...existingUrls, ...newUploadedUrls];

      const bannerData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        link: link.trim(),
        product_id: link ? link : null,
        placement,
        images: isCarousel ? finalImageUrls : finalImageUrls[0],
      };

      await dispatch(updateBanner({ id, bannerData })).unwrap();
      toast.success("Banner updated successfully!");
      navigate("/promotions/banners");
    } catch (err) {
      console.error("Failed to update banner:", err);
      const errorMsg =
        typeof err === "string" ? err : "Failed to update banner.";
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (isBannerLoading && !selectedBanner) {
    return (
      <div className="flex items-center justify-center min-h-75">
        <Loader2 size={30} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div id="edit-banner-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/banners")}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mb-1 cursor-pointer"
            type="button"
          >
            <ArrowLeft size={14} /> Back to Banners
          </button>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Edit Banner
          </h1>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm mt-4">
          {validationError}
        </div>
      )}

      <div className="flex justify-center mt-10">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl w-full">
          <div className="card p-5 space-y-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Banner Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Collection"
                  className="w-full px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Up to 50% Off"
                  className="w-full px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Placement Type *
                </label>
                <select
                  value={placement}
                  onChange={(e) => handlePlacementChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  required
                >
                  <option value="HERO_MAIN_SLIDE">
                    Hero Main Carousel (Multiple Images)
                  </option>
                  <option value="HERO_TOP_RIGHT">
                    Hero Top Right Banner (Single Image)
                  </option>
                  <option value="HERO_BOTTOM_RIGHT">
                    Hero Bottom Right Banner (Single Image)
                  </option>
                </select>
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Target Product (Searchable)
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsDropdownOpen(true);
                      if (!e.target.value) setLink("");
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={
                      productLoading?.products
                        ? "Loading products..."
                        : "Type to search product..."
                    }
                    className="w-full pl-9 pr-8 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  {link ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLink("");
                        setProductSearch("");
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <ChevronDown
                      size={16}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg">
                    {productLoading?.products ? (
                      <div className="p-3 text-xs text-center text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Loading
                        products...
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((prod) => {
                        const prodId = prod.id || prod._id || prod.productId;
                        const isSelected = String(prodId) === String(link);

                        return (
                          <div
                            key={prodId}
                            onClick={() => {
                              setLink(prodId);
                              setProductSearch(prod.name || prod.title || "");
                              setIsDropdownOpen(false);
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium"
                                : "text-text-primary-light dark:text-text-primary-dark"
                            }`}
                          >
                            <span className="truncate">
                              {prod.name || prod.title}
                            </span>
                            {prod.price && (
                              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-2">
                                ৳{prod.price}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-xs text-center text-gray-500">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-border-light dark:border-border-dark pt-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Banner Images{" "}
                  {isCarousel ? "(Multiple Allowed)" : "(Single Image Only)"} *
                </label>
                <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                  {images.length} Image(s) Selected
                </span>
              </div>

              <div className="relative border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-6 text-center bg-background-light dark:bg-background-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={isCarousel}
                  accept="image/*"
                  disabled={isSubmitting}
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark">
                  <ImageIcon size={22} />
                  <span className="text-xs font-semibold">
                    {isCarousel
                      ? "Click or drag images to select (Multiple)"
                      : "Click or drag an image to select"}
                  </span>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {images.map((url, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="relative group aspect-video rounded-lg overflow-hidden border border-border-light dark:border-border-dark bg-gray-100"
                    >
                      <img
                        src={url}
                        alt={`Banner preview ${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgIdx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/banners")}
              className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isUploading ? "Uploading Images..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}