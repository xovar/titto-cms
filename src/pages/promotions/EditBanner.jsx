import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import imageCompression from "browser-image-compression";
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";

import axiosInstance from "../../api/axiosInstance";
import {
  fetchBannerById,
  updateBanner,
  clearSelectedBanner,
} from "../../store/slices/bannerSlice"; // 👈 আপনার প্রজেক্টের পাথ অনুযায়ী অ্যাডজাস্ট করুন

export default function EditBanner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux State থেকে selectedBanner এবং loading আনা
  const { selectedBanner, loading: isBannerLoading } = useSelector(
    (state) => state.banners
  );

  // Banner Local State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");
  const [placement, setPlacement] = useState("HERO_MAIN_SLIDE");

  // Images and Status State
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const isCarousel = placement === "HERO_MAIN_SLIDE";

  // 🟢 ১. Redux Thunk দিয়ে ব্যানার ডাটা ফ্যাচ করা
  useEffect(() => {
    if (id) {
      dispatch(fetchBannerById(id));
    }

    // Clean up
    return () => {
      dispatch(clearSelectedBanner());
    };
  }, [id, dispatch]);

  // 🟢 ২. Redux-এর selectedBanner আপডেট হলে লোকাল স্টেটে পপুলেট করা
  useEffect(() => {
    if (selectedBanner) {
      setTitle(selectedBanner.title || "");
      setSubtitle(selectedBanner.subtitle || "");
      setLink(selectedBanner.link || "");
      setPlacement(selectedBanner.placement || selectedBanner.type || "HERO_MAIN_SLIDE");

      // Image Handling
      if (Array.isArray(selectedBanner.images)) {
        setImages(selectedBanner.images);
      } else if (selectedBanner.imageUrl || selectedBanner.image) {
        setImages([selectedBanner.imageUrl || selectedBanner.image]);
      } else {
        setImages([]);
      }
    }
  }, [selectedBanner]);

  // 🟢 ৩. Image Upload Handler (Fixed Syntax Error Here)
  const handleImageUpload = async (e) => {
    const inputElement = e.target;
    const files = Array.from(inputElement.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const formData = new FormData();

    try {
      const uploadFiles = isCarousel ? files : [files[0]];

      for (let file of uploadFiles) {
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
          headers: {
            "Content-Type": undefined,
          },
        }
      );

      const uploadedUrls =
        response.data?.urls ||
        response.data?.imageUrls ||
        response.data?.images ||
        [];

      if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
        if (isCarousel) {
          setImages((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
        } else {
          setImages([uploadedUrls[0]]);
        }
        setValidationError("");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      const serverMsg =
        error.response?.data?.message ||
        "Failed to upload images. Please try again.";
      setValidationError(serverMsg);
    } finally { // 👈 সঠিকভাবে `finally` বসানো হয়েছে
      setIsUploading(false);
      if (inputElement) inputElement.value = "";
    }
  };

  // 🟢 ৪. Image Remove Handler
  const handleRemoveImage = async (imgIdx) => {
    const imageUrlToRemove = images[imgIdx];
    if (!imageUrlToRemove) return;

    setImages((prev) => prev.filter((_, idx) => idx !== imgIdx));

    try {
      await axiosInstance.post("/upload/delete-image", {
        imageUrl: imageUrlToRemove,
      });
      setValidationError("");
    } catch (error) {
      console.error("Failed to delete image from server:", error);
      const serverMsg =
        error.response?.data?.message ||
        "Failed to delete image from server. Removed locally.";
      setValidationError(serverMsg);
    }
  };

  // 🟢 ৫. Redux Thunk এর মাধ্যমে Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) return setValidationError("Banner title is required.");
    if (images.length === 0)
      return setValidationError("Please upload at least one image.");

    const bannerData = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      link: link.trim(),
      placement,
      images: isCarousel ? images : images[0],
    };

    try {
      setIsSubmitting(true);
      // Redux Thunk Call
      const resultAction = await dispatch(
        updateBanner({ id, bannerData })
      );

      if (updateBanner.fulfilled.match(resultAction)) {
        navigate("/banners");
      } else {
        setValidationError(
          resultAction.payload || "Failed to update banner."
        );
      }
    } catch (err) {
      console.error("Failed to update banner:", err);
      setValidationError("Failed to update banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBannerLoading && !selectedBanner) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={30} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="" id="edit-banner-view">
      {/* Header Bar */}
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

      {/* Error Message */}
      {validationError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm mt-4">
          {validationError}
        </div>
      )}

      {/* Main Form */}
      <div className="flex justify-center mt-10">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl w-full">
          <div className="card p-5 space-y-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Banner Configuration
            </h3>

            {/* Title & Subtitle */}
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

            {/* Placement & Target Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Placement Type *
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="HERO_MAIN_SLIDE">Hero Main Carousel (Multiple Images)</option>
                  <option value="HERO_TOP_RIGHT">Hero Top Right Banner (Single Image)</option>
                  <option value="HERO_BOTTOM_RIGHT">Hero Bottom Right Banner (Single Image)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Target Link / URL
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /category/shoes"
                  className="w-full px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-2 border-t border-border-light dark:border-border-dark pt-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Banner Images {isCarousel ? "(Multiple Allowed)" : "(Single Image Only)"} *
                </label>
                <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                  {images.length} Image(s) Selected
                </span>
              </div>

              <div className="relative border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-6 text-center bg-background-light dark:bg-background-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <input
                  type="file"
                  multiple={isCarousel}
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark">
                  {isUploading ? (
                    <>
                      <Loader2 size={22} className="animate-spin text-blue-600" />
                      <span className="text-xs font-semibold">Compressing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={22} />
                      <span className="text-xs font-semibold">
                        {isCarousel
                          ? "Click or drag images to upload (Multiple)"
                          : "Click or drag an image to upload"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {images.map((url, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="relative group aspect-video rounded-lg overflow-hidden border border-border-light dark:border-border-dark bg-gray-100"
                    >
                      <img
                        src={url}
                        alt={`Banner ${imgIdx + 1}`}
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

          {/* Action Buttons */}
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
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
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