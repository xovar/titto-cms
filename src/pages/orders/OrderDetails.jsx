import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  User,
  Phone,
  MapPin,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Calendar,
  CreditCard,
  Check,
} from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  // 🔄 ব্যাকএন্ড থেকে নির্দিষ্ট অর্ডারের ডিটেইলস ফেচ করা
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
          setStatus(data.status || 'pending');
        } else {
          console.error('Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // ✏️ অর্ডার স্ট্যাটাস আপডেট করার ফাংশন
  const handleStatusUpdate = async () => {
    setUpdating(true);
    setMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: 'PATCH', // আপনার API অনুযায়ী PUT বা PATCH হতে পারে
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setMessage('Order status updated successfully!');
        setOrder((prev) => ({ ...prev, status }));
      } else {
        setMessage('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Network error. Could not update status.');
    } finally {
      setUpdating(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // 🖨️ ইনভয়েস প্রিন্ট ফাংশন
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-secondary-light dark:text-text-secondary-dark">
        <RefreshCw size={32} className="animate-spin text-accent-brand mb-3" />
        <p className="font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-rose-500">Order Not Found</h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
          The requested order ID does not exist or has been removed.
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent-brand text-white rounded-lg text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  // হিসাব-নিকাশ
  const subtotal = parseFloat(order.price || 0);
  const deliveryCharge = parseFloat(order.delivery_charge || 0);
  const discount = parseFloat(order.discount || 0);
  const grandTotal = subtotal + deliveryCharge - discount;

  return (
    <div className="space-y-6 p-4 md:p-6 print:p-0 print:bg-white print:text-black">
      {/* 🟢 পেজ হেডার (প্রিন্টের সময় হাইড থাকবে) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Order #{order.id}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-brand/10 text-accent-brand font-semibold capitalize">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 flex items-center gap-1">
              <Calendar size={13} />
              Placed on {new Date(order.created_at).toLocaleString('en-GB')}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-medium rounded-lg transition-all shadow-sm text-sm"
        >
          <Printer size={18} />
          Print Invoice
        </button>
      </div>

      {/* 🖨️ প্রিন্ট হেডলাইন (শুধুমাত্র প্রিন্ট মোডে দৃশ্যমান) */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">TITTO CRM</h1>
            <p className="text-xs text-gray-600">Official Sales Invoice</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">INVOICE #{order.id}</h2>
            <p className="text-xs text-gray-600">
              Date: {new Date(order.created_at).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>

      {/* ⚙️ স্ট্যাটাস আপডেট কন্ট্রোল বার (প্রিন্টের সময় হাইড থাকবে) */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-accent-brand" />
            <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Update Status:
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 capitalize"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={handleStatusUpdate}
              disabled={updating || status === order.status}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-brand text-white font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={16} />
              {updating ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>

        {message && (
          <p className="text-xs mt-3 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check size={14} /> {message}
          </p>
        )}
      </div>

      {/* 📊 গ্রিড লেআউট (প্রিন্ট এবং রেগুলার ভিউ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* বাম পাশ: কাস্টমার ও ইনভয়েস আইটেম টেবিল (২ কলাম) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 📦 আইটেমস টেবিল */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm print:border-gray-300">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
              <Package size={18} className="text-accent-brand" />
              <span>Ordered Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark uppercase text-[11px] font-semibold tracking-wider print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="px-5 py-3">Product Description</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Unit Price</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark print:divide-gray-200">
                  {/* যদি আপনার কাছে একাধিক আইটেমের অ্যারেই থাকে তবে ম্যাপ করতে পারেন */}
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark print:text-black">
                          {item.name || item.product_name}
                        </td>
                        <td className="px-5 py-3.5 text-center">{item.quantity}</td>
                        <td className="px-5 py-3.5 text-right">৳{item.price}</td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          ৳{(item.price * item.quantity).toLocaleString('en-BD')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* সিংগেল প্রডাক্ট অডার রেসপন্সের ক্ষেত্রে ফ্যালব্যাক */
                    <tr>
                      <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark print:text-black">
                        {order.product_name || 'Standard Order Item'}
                      </td>
                      <td className="px-5 py-3.5 text-center">{order.quantity || 1}</td>
                      <td className="px-5 py-3.5 text-right">৳{subtotal}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        ৳{subtotal.toLocaleString('en-BD')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 💰 প্রাইস সামারি */}
            <div className="p-5 bg-background-light/50 dark:bg-background-dark/50 border-t border-border-light dark:border-border-dark space-y-2 text-sm print:bg-gray-50">
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark print:text-gray-700">
                <span>Subtotal:</span>
                <span>৳{subtotal.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark print:text-gray-700">
                <span>Delivery Charge:</span>
                <span>৳{deliveryCharge.toLocaleString('en-BD')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span>-৳{discount.toLocaleString('en-BD')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-text-primary-light dark:text-text-primary-dark print:text-black pt-2 border-t border-border-light dark:border-border-dark">
                <span>Grand Total:</span>
                <span className="text-accent-brand print:text-black">
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ডান পাশ: কাস্টমার ও ডেলিভারি ডিটেইলস (১ কলাম) */}
        <div className="space-y-6">
          {/* 👤 কাস্টমার ইনফো কার্ড */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-4 shadow-sm print:border-gray-300">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
              <User size={18} className="text-accent-brand" />
              Customer Details
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Name</p>
                <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {order.first_name} {order.last_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Phone</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-accent-brand" />
                  {order.phone}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Address</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-start gap-1.5 mt-0.5">
                  <MapPin size={16} className="text-accent-brand shrink-0 mt-0.5" />
                  <span>{order.address || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 💳 পেমেন্ট ও নোটস কার্ড */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-4 shadow-sm print:border-gray-300">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
              <CreditCard size={18} className="text-accent-brand" />
              Payment Information
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Payment Method</p>
                <p className="font-semibold capitalize text-text-primary-light dark:text-text-primary-dark">
                  {order.payment_method || 'Cash on Delivery (COD)'}
                </p>
              </div>

              {order.note && (
                <div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Order Note</p>
                  <p className="text-xs bg-background-light dark:bg-background-dark p-2.5 rounded-lg border border-border-light dark:border-border-dark mt-1 italic text-text-primary-light dark:text-text-primary-dark">
                    "{order.note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🖨️ ইনভয়েস ফুটার (শুধুমাত্র প্রিন্ট মোডে আসবে) */}
      <div className="hidden print:block pt-12 text-center text-xs text-gray-500 border-t mt-8">
        <p>Thank you for shopping with TITTO CRM!</p>
        <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  );
}