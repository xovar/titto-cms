import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrderById,
  updateOrderStatus,
  clearSelectedOrder,
} from '../../store/slices/orderSlice';

import {
  ArrowLeft,
  Printer,
  User,
  Phone,
  MapPin,
  Package,
  Clock,
  Save,
  Calendar,
  CreditCard,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Redux State থেকে ডাটা নেওয়া
  const { selectedOrder, loading, updating, error } = useSelector((state) => state.orders);

  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id && id !== 'undefined') {
      dispatch(fetchOrderById(id));
    }

    return () => {
      dispatch(clearSelectedOrder());
    };
  }, [dispatch, id]);

  const order = selectedOrder?.data || selectedOrder?.order || selectedOrder;

  useEffect(() => {
    if (order?.status) {
      setStatus(order.status);
    }
  }, [order?.status]);

  const handleStatusUpdate = async () => {
    if (!id || status === order?.status) return;

    setMessage('');
    const resultAction = await dispatch(updateOrderStatus({ id, status }));

    if (updateOrderStatus.fulfilled.match(resultAction)) {
      setMessage('Order status updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    }
  };

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

  if (!order || (!order.id && !order._id)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-rose-500">Order Not Found</h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
          {error || `The requested order ID (${id}) does not exist or has been removed.`}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent-brand text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  // 🧮 Subtotal & Delivery Charge Calculation
  const deliveryCharge = parseFloat(
    order.deliveryCharge ?? order.delivery_charge ?? 0
  );

  const computedSubtotal = order.items && order.items.length > 0
    ? order.items.reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseFloat(item.quantity || item.qty || 1)), 0)
    : parseFloat(order.price || 0);

  const subtotal = computedSubtotal;

  // 🎯 Percentage (%) Based Discount Calculation
  const discountAmount = (() => {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((acc, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const itemQty = parseFloat(item.quantity || item.qty || 1);
        const itemDiscVal = parseFloat(item.discount || 0);
        const type = item.discount_type || item.discountType || order.discount_type || order.discountType || 'percent';

        // Check if discount is percentage or fixed amount
        if (type === 'percent' || type === 'percentage') {
          return acc + ((itemPrice * itemDiscVal) / 100) * itemQty;
        }
        return acc + (itemDiscVal * itemQty);
      }, 0);
    }

    const orderDiscVal = parseFloat(order.discount || 0);
    const type = order.discount_type || order.discountType || 'percent';

    if (type === 'percent' || type === 'percentage') {
      return (subtotal * orderDiscVal) / 100;
    }
    return orderDiscVal;
  })();

  // Grand Total = Subtotal + Delivery Charge - Calculated Discount
  const grandTotal = Math.max(0, subtotal + deliveryCharge - discountAmount);

  const orderIdDisplay = order.id || order._id || id;

  const customerName = (order.firstName || order.first_name || order.lastName || order.last_name)
    ? `${order.firstName || order.first_name || ''} ${order.lastName || order.last_name || ''}`.trim()
    : (order.name || order.customer_name || 'Customer');

  const fullAddress = [
    order.address,
    order.cityDistrict || order.city_district || order.district,
    order.postalCode || order.postal_code,
  ]
    .filter(Boolean)
    .join(', ') || 'N/A';

  return (
    <div className="space-y-6 p-4 md:p-6 print:p-0 print:bg-white print:text-black">
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2 print:hidden">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
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
                Order #{orderIdDisplay}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-brand/10 text-accent-brand font-semibold capitalize">
                {order.status || 'Pending'}
              </span>
            </div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 flex items-center gap-1">
              <Calendar size={13} />
              Placed on {order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleString('en-GB') : 'N/A'}
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

      {/* Printable Title */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">TITTO CRM</h1>
            <p className="text-xs text-gray-600">Official Sales Invoice</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">INVOICE #{orderIdDisplay}</h2>
            <p className="text-xs text-gray-600">
              Date: {order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleDateString('en-GB') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Update Status Bar */}
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

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const itemQty = Number(item.quantity || item.qty || 1);
                      const itemPrice = parseFloat(item.price || 0);
                      const itemTotal = itemPrice * itemQty;
                      const itemDiscountVal = parseFloat(item.discount || 0);
                      const itemDiscType = item.discount_type || item.discountType || 'percent';

                      return (
                        <tr key={idx}>
                          <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark print:text-black">
                            <div>
                              {item.name || item.product_name || 'Product Item'}
                              {(item.color || item.size) && (
                                <span className="block text-xs text-text-secondary-light dark:text-text-secondary-dark font-normal">
                                  {item.color && `Color: ${item.color}`} {item.color && item.size && '|'} {item.size && `Size: ${item.size}`}
                                </span>
                              )}
                              {itemDiscountVal > 0 && (
                                <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-normal">
                                  (Discount: {itemDiscType === 'flat' ? `৳${itemDiscountVal}` : `${itemDiscountVal}%`})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">{itemQty}</td>
                          <td className="px-5 py-3.5 text-right">৳{itemPrice.toLocaleString('en-BD')}</td>
                          <td className="px-5 py-3.5 text-right font-semibold">
                            ৳{itemTotal.toLocaleString('en-BD')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-5 py-3.5 font-medium text-text-primary-light dark:text-text-primary-dark print:text-black">
                        Standard Order Item
                      </td>
                      <td className="px-5 py-3.5 text-center">1</td>
                      <td className="px-5 py-3.5 text-right">৳{subtotal.toLocaleString('en-BD')}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        ৳{subtotal.toLocaleString('en-BD')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Price Summary */}
            <div className="p-5 bg-background-light/50 dark:bg-background-dark/50 border-t border-border-light dark:border-border-dark space-y-2 text-sm print:bg-gray-50">
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark print:text-gray-700">
                <span>Subtotal:</span>
                <span>৳{subtotal.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark print:text-gray-700">
                <span>Delivery Charge:</span>
                <span>৳{deliveryCharge.toLocaleString('en-BD')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount:</span>
                  <span>-৳{discountAmount.toLocaleString('en-BD')}</span>
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

        {/* Right Sidebar: Customer & Payment */}
        <div className="space-y-6">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-4 shadow-sm print:border-gray-300">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
              <User size={18} className="text-accent-brand" />
              Customer Details
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Name</p>
                <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {customerName}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Phone</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-accent-brand" />
                  {order.phone || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Shipping Address</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-start gap-1.5 mt-0.5">
                  <MapPin size={16} className="text-accent-brand shrink-0 mt-0.5" />
                  <span>{fullAddress}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-4 shadow-sm print:border-gray-300">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
              <CreditCard size={18} className="text-accent-brand" />
              Payment Information
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Payment Method</p>
                <p className="font-semibold capitalize text-text-primary-light dark:text-text-primary-dark">
                  {order.payment_method || order.paymentMethod || 'Cash on Delivery (COD)'}
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
    </div>
  );
}