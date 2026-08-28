import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function LockScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ১. Firebase Client Auth দিয়ে ভেরিফাই
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ২. Firebase User & ID Token সংগ্রহ
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // ৩. ব্যাকএন্ড API-তে ইউজার ও রোল ভেরিফিকেশনের জন্য পাঠানো
      const res = await fetch(
        "https://api.titto.com.bd/api/auth/verify-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "লগইন করতে সমস্যা হয়েছে!");
      }

      // 🛑 ৪. কঠোর রোল ফিল্টারিং: শুধুমাত্র Admin রোল ঢুকতে পারবে
      if (data.user.role !== "admin") {
        throw new Error(
          "অ্যাক্সেস ডিনাইড! ম্যানেজাররা এই সেন্ট্রাল অ্যাডমিন প্যানেলে লগইন করতে পারবেন না। আপনার জন্য নির্দিষ্ট POS প্যানেল ব্যবহার করুন।"
        );
      }

      // 🎯 ৫. অ্যাডমিনের তথ্য লোকাল স্টোরেজে সেট করা
      const loggedInUserInfo = {
        id: data.user.id,
        firebaseUid: user.uid,
        name: data.user.name || user.displayName || "Main Admin",
        email: data.user.email || user.email,
        role: "admin",
        outletId: null,
        outletName: "All Outlets",
      };

      // LocalStorage-এ অ্যাডমিন ডাটা সেভ
      localStorage.setItem("admin_user", JSON.stringify(loggedInUserInfo));

      // 🎯 ৬. সেন্ট্রাল ড্যাশবোর্ডে রিডাইরেক্ট
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Auth Error:", err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে!");
      } else if (err.code === "auth/too-many-requests") {
        setError("অনেকবার ভুল পাসওয়ার্ড দেওয়া হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      } else {
        setError(err.message || "লগইন করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fbfafd] flex flex-col items-center justify-center p-4">
      {/* 💳 সেন্ট্রাল কার্ড */}
      <div className="w-full max-w-120 bg-[#f8f5fa] border border-[#f0eaf5] rounded-2xl p-8 sm:p-10 shadow-xs">
        {/* 🏷️ লোগো */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1 font-extrabold text-2xl text-slate-900 tracking-tight">
            <span className="text-red-500 font-black text-3xl">H!</span>
            <span>Buddy</span>
          </div>
        </div>

        {/* 👤 হেডার আইকন/মেসেজ */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl mb-3 border-2 border-indigo-200 shadow-sm">
            🔐
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Super Admin Panel</h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with central admin credentials
          </p>
        </div>

        {/* ⚠️ এরর মেসেজ বক্স */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {/* 🔒 আনলক/লগইন ফর্ম */}
        <form onSubmit={handleUnlock} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-normal text-slate-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@something.com"
              required
              className="w-full px-4 py-2.5 bg-[#f4f0f8] border border-[#e8dfef] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-normal text-slate-700 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-[#f4f0f8] border border-[#e8dfef] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#6b51b6] hover:bg-[#5b439f] active:bg-[#4d3788] text-white font-medium text-sm rounded-lg shadow-sm transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying Access..." : "Log In to Admin"}
          </button>
        </form>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        © 2026 Titto Admin Panel
      </footer>
    </div>
  );
}