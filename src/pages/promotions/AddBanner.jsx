import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";

export default function AddBanner() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    type: "HERO_SLIDE",
    link: "",
    image: "",
    isActive: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving Data:", formData);
    // API Call logic here...
    alert("Banner added successfully!");
    navigate("/promotions/banners");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">Create New Banner</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Banner Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Summer Special Offer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2.5 border border-border-light dark:border-border-dark rounded-lg bg-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Subtitle / Highlight</label>
          <input
            type="text"
            placeholder="e.g. Get 50% OFF"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full p-2.5 border border-border-light dark:border-border-dark rounded-lg bg-transparent text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Placement Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-sm"
            >
              <option value="HERO_SLIDE">Hero Carousel Slide</option>
              <option value="HERO_TOP_SIDE">Hero Top Side</option>
              <option value="HERO_BOTTOM_SIDE">Hero Bottom Side</option>
              <option value="PROMO_CARD">Promotional Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Target Link (URL)</label>
            <input
              type="text"
              placeholder="/products/category"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full p-2.5 border border-border-light dark:border-border-dark rounded-lg bg-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Image URL</label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full p-2.5 border border-border-light dark:border-border-dark rounded-lg bg-transparent text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <label htmlFor="active" className="text-sm">Publish Immediately</label>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
          <Save size={16} /> Save Banner
        </button>
      </form>
    </div>
  );
}