import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, UserCheck, Phone, Mail, ShoppingBag, CreditCard, 
  PackageCheck, ImageOff, Loader2, Calendar, Store 
} from 'lucide-react';
// 👈 আপনার প্যাথ অনুযায়ী customerSlice থেকে import নিশ্চিত করুন
import { searchCustomerByPhone, clearSearchResult } from '../../store/slices/customerSlice';

const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  shipped: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function CustomerModal({ customer, onClose }) {
  const dispatch = useDispatch();

  // Redux store থেকে সার্চের ডাটা রিড করা
  const { searchResult, searching } = useSelector((state) => state.customers);

  // মোডাল ওপেন হলে কাস্টমারের ফোন নাম্বার দিয়ে বিস্তারিত অর্ডার ডাটা ফেচ করা
  useEffect(() => {
    if (customer?.phone) {
      // ফোন নাম্বার থেকে শুধু ডিজিটগুলো নেওয়া
      const cleanPhone = String(customer.phone).replace(/\D/g, "");
      if (cleanPhone) {
        dispatch(searchCustomerByPhone(cleanPhone));
      }
    }

    return () => {
      dispatch(clearSearchResult());
    };
  }, [customer, dispatch]);

  // ESC Key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ফেচ হওয়া কাস্টমার অথবা সিলেক্ট হওয়া কাস্টমারের ডাটা কম্বাইন করা
  const detailedCustomer = searchResult?.customer || customer;
  const orders = detailedCustomer?.orders || [];
  
  // কাস্টমারের সব অর্ডারের সমস্ত প্রোডাক্ট আইটেমস এক সাথে ফ্ল্যাট করা
  const allPurchasedItems = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.flatMap(order => 
      (order.items || []).map(item => ({
        ...item,
        orderId: order.id,
        orderStatus: order.status,
        orderDate: order.createdAt
      }))
    );
  }, [orders]);

  const totalSpent = useMemo(() => {
    if (detailedCustomer?.totalSpent !== undefined) return Number(detailedCustomer.totalSpent);
    return orders.reduce((sum, o) => sum + Number(o.price || 0) + Number(o.deliveryCharge || 0), 0);
  }, [detailedCustomer, orders]);

  if (!customer) return null;

  return createPortal(
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Background Overlay */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="text-indigo-600 dark:text-indigo-400" size={22} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Customer Details & Purchase History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 text-sm overflow-y-auto pr-1 flex-1 custom-scrollbar">
          
          {/* Customer Info & Stats Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl space-y-2 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                <span className="text-xs text-gray-400 w-12">Name:</span>
                <span className="font-semibold">{detailedCustomer?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Phone size={14} className="text-indigo-500 shrink-0" />
                <span className="text-xs text-gray-400 w-12">Phone:</span>
                <span>+88{detailedCustomer?.phone || 'N/A'}</span>
              </div>
              {detailedCustomer?.email && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Mail size={14} className="text-indigo-500 shrink-0" />
                  <span className="text-xs text-gray-400 w-12">Email:</span>
                  <span className="truncate">{detailedCustomer.email}</span>
                </div>
              )}
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <ShoppingBag size={14} />
                  <span>Total Orders</span>
                </div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {orders.length}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CreditCard size={14} />
                  <span>Total Spent</span>
                </div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100 font-mono">
                  ৳{totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Loader or Purchased Items */}
          {searching ? (
            <div className="flex items-center justify-center py-10 text-indigo-600">
              <Loader2 size={28} className="animate-spin" />
              <span className="ml-2 text-sm font-medium">Fetching order history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-gray-800">
                <PackageCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  Purchased Products ({allPurchasedItems.length})
                </h4>
              </div>

              {allPurchasedItems.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-xl text-gray-400 text-xs">
                  No purchased items found for this customer.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  {allPurchasedItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-3 hover:bg-gray-100/50 dark:hover:bg-gray-800/60 transition-colors">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-11 h-11 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0 text-gray-400">
                            <ImageOff size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                            {item.name || "Unknown Product"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>Qty: <strong className="text-gray-600 dark:text-gray-300">{item.quantity || 1}</strong></span>
                            {[item.color, item.size].filter(Boolean).length > 0 && (
                              <span>• {[item.color, item.size].filter(Boolean).join(" / ")}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                          ৳{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                        </p>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium capitalize inline-block mt-1 ${STATUS_STYLES[item.orderStatus] || STATUS_STYLES.pending}`}>
                          {item.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}