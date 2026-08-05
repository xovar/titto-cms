import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBanners,
  deleteBanner,
  toggleBannerStatus,
} from "../../store/slices/bannerSlice"; // 👈 স্লাইসের সঠিক পাথ নিশ্চিত করুন

import {
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

// 🛠️ আপনার ব্যাকএন্ডের মূল URL (প্রয়োজনে পোর্ট বা ডোমেইন পরিবর্তন করুন)
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function AllBanners() {
  const dispatch = useDispatch();

  // 🟢 Redux State থেকে Banners, Loading, এবং Error ডাটা আনা
  const { items: banners = [], loading = false, error = null } = useSelector(
    (state) => state.banners || {}
  );

  console.log(banners);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // 🟢 ১ম বার কম্পোনেন্ট লোড হলে ব্যানার ডাটা ফ্যাচ করা
  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  // 🟢 Filter & Search Logic
  const filteredBanners = Array.isArray(banners)
    ? banners.filter((banner) => {
        const title = banner?.title || "";
        const placement = banner?.placement || banner?.type || "";

        const matchesSearch = title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesType = filterType === "ALL" || placement === filterType;

        return matchesSearch && matchesType;
      })
    : [];

  // 🟢 Toggle Status via Redux API
  const handleToggleStatus = (id, currentStatus) => {
    if (!id) return;
    dispatch(toggleBannerStatus({ id, is_active: !currentStatus }));
  };

  // 🟢 Delete Handler via Redux API
  const handleDelete = (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this banner?")) {
      dispatch(deleteBanner(id));
    }
  };

  // 🛠️ সেফ হেলপার: ইমেজের সঠিক ইউআরএল বের করা (Relative Path & Full URL Safe)
  const getDisplayImage = (images) => {
    const placeholder = "https://via.placeholder.com/150";
    if (!images) return placeholder;

    let targetUrl = "";

    // ১. যদি সরাসরি অ্যারে হয়
    if (Array.isArray(images)) {
      targetUrl = images[0] || "";
    } 
    // ২. যদি স্ট্রিং হয়
    else if (typeof images === "string") {
      const trimmed = images.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) targetUrl = parsed[0] || "";
        else if (typeof parsed === "string") targetUrl = parsed;
      } catch (e) {
        targetUrl = trimmed.replace(/^"+|"+$/g, "");
      }
    }

    if (!targetUrl) return placeholder;

    // ৩. যদি পূর্ণাংগ HTTP/HTTPS লিঙ্ক হয়
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      return targetUrl;
    }

    // ৪. যদি লোকাল আপলোড ফাইল হয় (যেমন: /uploads/image.jpg)
    const cleanPath = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
    return `${SERVER_BASE_URL}${cleanPath}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 🟢 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Homepage Banner Manager
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Control main slider carousel, top-right, and bottom-right promo banners.
          </p>
        </div>

        <Link
          to="/promotions/add"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <PlusCircle size={18} />
          <span>Create New Banner</span>
        </Link>
      </div>

      {/* 🟢 Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark">
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
          />
          <input
            type="text"
            placeholder="Search banner title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter
            size={18}
            className="text-text-secondary-light dark:text-text-secondary-dark"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Placement Types</option>
            <option value="HERO_MAIN_SLIDE">Hero Main Slide (Left Carousel)</option>
            <option value="HERO_TOP_RIGHT">Hero Top Right Banner</option>
            <option value="HERO_BOTTOM_RIGHT">Hero Bottom Right Banner</option>
          </select>
        </div>
      </div>

      {/* 🔴 Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {typeof error === "string" ? error : "An error occurred while fetching banners."}
        </div>
      )}

      {/* 🟢 Banners Table / Loading / Empty State */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading banners...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <ImageIcon className="mx-auto mb-3 opacity-40" size={40} />
            <p className="text-base font-medium">No banners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Banner Details</th>
                  <th className="py-3.5 px-4">Placement</th>
                  <th className="py-3.5 px-4">Linked Product</th>
                  <th className="py-3.5 px-4">Target Link</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filteredBanners.map((banner) => {
                  const bannerImage = getDisplayImage(banner?.images || banner?.image);
                  const placement = banner?.placement || banner?.type || "HERO_MAIN_SLIDE";
                  
                  const isActive =
                    banner?.is_active !== undefined
                      ? Number(banner.is_active) === 1 || banner.is_active === true
                      : Boolean(banner?.isActive);

                  return (
                    <tr
                      key={banner?.id || Math.random()}
                      className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors"
                    >
                      {/* Banner Title & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={bannerImage}
                            alt={banner?.title || "Banner"}
                            className="w-16 h-12 object-cover rounded border border-border-light dark:border-border-dark bg-background-light"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/150";
                            }}
                          />
                          <div>
                            <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                              {banner?.title || "Untitled Banner"}
                            </p>
                            {banner?.subtitle && (
                              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                Sub: {banner.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Placement Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md border ${
                            placement === "HERO_MAIN_SLIDE"
                              ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800"
                              : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                          }`}
                        >
                          {String(placement).replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Linked Product Info */}
                      <td className="py-3.5 px-4 text-xs">
                        {banner?.product ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                              {banner.product?.name || "Product"}
                            </p>
                            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark font-mono">
                              ${banner.product?.price || "0.00"}
                            </p>
                          </div>
                        ) : banner?.product_id ? (
                          <span className="font-mono text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                            ID: {banner.product_id}
                          </span>
                        ) : (
                          <span className="text-text-secondary-light dark:text-text-secondary-dark italic text-[11px]">
                            None
                          </span>
                        )}
                      </td>

                      {/* Target Link */}
                      <td className="py-3.5 px-4 font-mono text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {banner?.link ? (
                          <a
                            href={banner.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline hover:text-blue-500"
                          >
                            {banner.link}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(banner?.id, isActive)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle size={13} /> Active
                            </>
                          ) : (
                            <>
                              <XCircle size={13} /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/promotions/edit/${banner?.id}`}
                            className="p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:text-blue-600 hover:bg-background-light dark:hover:bg-background-dark rounded-md transition-colors"
                            title="Edit Banner"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(banner?.id)}
                            className="p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-600 hover:bg-background-light dark:hover:bg-background-dark rounded-md transition-colors"
                            title="Delete Banner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}