import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase"; // আপনার firebase.js ফাইলের সঠিক পাথ দিন

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
      // ১. Google Firebase দিয়ে Email/Password ভেরিফাই
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // ২. Firebase User & ID Token সংগ্রহ
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // 🔗 ৩. আপনার Node.js ব্যাকএন্ড API-তে ভেরিফিকেশনের জন্য পাঠানো
      // 💡 নোট: প্রয়োজন অনুযায়ী ব্যাকএন্ড ডোমেইন পরিবর্তন করুন (যেমন: https://yourdomain.com/api/auth/verify-admin)
      const res = await fetch(
        "https://api.titto.com.bd/api/auth/verify-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      const data = await res.json();

      // ❌ ব্যাকএন্ড যদি বলে ইউজার অ্যাডমিন না (403 Forbidden) বা অন্য সমস্যা
      if (!res.ok) {
        throw new Error(data.message || "আপনার অ্যাডমিন এক্সেস নেই!");
      }

      console.log("Logged in Admin User:", data.user);

      // optional: লোকাল স্টোরেজে ইউজারের তথ্য সেভ করে রাখতে পারেন
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      // 🎯 ৪. ব্যাকএন্ড থেকে ভেরিফিকেশন সফল হলে ড্যাশবোর্ডে নেভিগেট
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Auth Error:", err);

      // ফায়ারবেস বা ব্যাকএন্ডের এরর মেসেজ হ্যান্ডলিং
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found"
      ) {
        setError("ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে!");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "অনেকবার ভুল পাসওয়ার্ড দেওয়া হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        );
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

        {/* 👤 ইউজার প্রোফাইল পিকচার ও নাম */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-orange-500/80 shadow-md mb-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
              alt="David Dev"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-base font-medium text-slate-700">David Dev</h2>
        </div>

        {/* ⚠️ এরর মেসেজ বক্স */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center">
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
              placeholder="example@something.com"
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
            {loading ? "Verifying Admin..." : "Log In"}
          </button>
        </form>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        © 2026 Titto
      </footer>
    </div>
  );
}
