import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, Phone, Mail, ShoppingBag, CreditCard } from 'lucide-react';

export default function CustomerModal({ customer, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!customer) return null;

  return createPortal(
    /* z-[99999] দিয়ে টপবার ও সাইডবারের উপরে তোলা হলো */
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* ব্যাকগ্রাউন্ডে ক্লিক করলে মোডাল বন্ধ করার জন্য */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      {/* Card Content */}
      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Customer Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
              <span className="text-xs text-slate-400 w-12">Name:</span>
              <span className="font-semibold">{customer.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Phone size={14} className="text-blue-500 shrink-0" />
              <span className="text-xs text-slate-400 w-12">Phone:</span>
              <span>{customer.phone || 'N/A'}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Mail size={14} className="text-blue-500 shrink-0" />
                <span className="text-xs text-slate-400 w-12">Email:</span>
                <span className="truncate">{customer.email}</span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <ShoppingBag size={14} />
                <span>Total Orders</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {customer.totalOrders ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CreditCard size={14} />
                <span>Total Spent</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                ৳{Number(customer.totalSpent ?? 0).toLocaleString('en-BD')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}