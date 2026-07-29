import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrder } from '../../store/slices/orderSlice'; // ⚠️ আপনার সঠিক Path মিলিয়ে নিন
import { X, Save, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function EditOrderModal({ isOpen, onClose, order }) {
  const dispatch = useDispatch();
  const { updating, error } = useSelector((state) => state.orders || {});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cityDistrict: '',
    status: 'pending',
    deliveryCharge: 0,
    note: '',
    items: [],
  });

  // 1️⃣ Sync local state when order changes or modal opens
  useEffect(() => {
    if (order) {
      setFormData({
        firstName: order.firstName || order.first_name || '',
        lastName: order.lastName || order.last_name || '',
        phone: order.phone || '',
        address: order.address || order.shipping_address || '',
        cityDistrict: order.cityDistrict || order.city_district || order.district || '',
        status: order.status || 'pending',
        deliveryCharge: parseFloat(order.deliveryCharge ?? order.delivery_charge ?? 0),
        note: order.note || '',
        // 🛠️ FIX: items এর productId, variantId, size, color সহ সম্পূর্ণ তথ্য সংরেক্ষণ করা হচ্ছে
        items: Array.isArray(order.items) && order.items.length > 0
          ? order.items.map((item) => ({
              id: item.id || null,
              productId: item.productId || item.product_id || item.id || 'manual_item',
              variantId: item.variantId || item.variant_id || null,
              name: item.name || item.product_name || item.title || '',
              category: item.category || null,
              color: item.color || null,
              size: item.size || null,
              price: parseFloat(item.price || 0),
              quantity: parseInt(item.quantity || item.qty || 1, 10),
              discount: parseFloat(item.discount || 0),
              image: item.image || null,
            }))
          : [],
      });
    }
  }, [order]);

  // 2️⃣ Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  // ✏️ General Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'deliveryCharge' ? (value === '' ? '' : Math.max(0, parseFloat(value) || 0)) : value,
    }));
  };

  // ✏️ Order Item Field Change
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    if (field === 'price' || field === 'quantity') {
      const numValue = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      updatedItems[index][field] = numValue;
    } else {
      updatedItems[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  // ➕ Add New Empty Item Row
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      // 🛠️ FIX: নতুন ম্যানুয়াল আইটেম যোগ করার সময় ডিফল্ট productId দেওয়া হলো
      items: [
        ...prev.items, 
        { 
          productId: `manual_${Date.now()}`, 
          variantId: null,
          name: '', 
          price: 0, 
          quantity: 1,
          color: null,
          size: null
        }
      ],
    }));
  };

  // 🗑️ Remove Item Row
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      alert('An order must contain at least one item!');
      return;
    }
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  // 🧮 Dynamic Price Calculations
  const calculatedSubtotal = formData.items.reduce(
    (acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
    0
  );
  const deliveryChargeVal = parseFloat(formData.deliveryCharge) || 0;
  const grandTotal = calculatedSubtotal + deliveryChargeVal;

  // 💾 Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: order.id || order._id,
      ...formData,
      deliveryCharge: deliveryChargeVal,
      price: calculatedSubtotal,
      total_amount: grandTotal,
    };

    const resultAction = await dispatch(updateOrder(payload));
    if (updateOrder.fulfilled.match(resultAction) || resultAction.meta?.requestStatus === 'fulfilled') {
      onClose(); // Success
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Outer Card Wrapper */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] max-h-187.5 overflow-hidden">
        
        {/* 🟢 FIXED HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Edit Order #{order.id || order._id}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update order information and items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 📋 FORM & SCROLLABLE CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          
          {/* 📜 Middle Area - Scrollable */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
            
            {/* ⚠️ Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">City / District</label>
                  <input
                    type="text"
                    name="cityDistrict"
                    value={formData.cityDistrict}
                    onChange={handleInputChange}
                    placeholder="e.g. Dhaka, Chittagong"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Order Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Delivery Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 📦 Order Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3">Product Title</th>
                      <th className="p-3 text-center w-20">Qty</th>
                      <th className="p-3 text-right w-28">Price (৳)</th>
                      <th className="p-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="bg-white dark:bg-slate-900">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder="Product Name"
                            required
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-16 text-center px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-24 text-right px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 📝 Order Note */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Order Note (Optional)</label>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="e.g. Special instructions for delivery..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* 💰 Price Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 text-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  ৳{calculatedSubtotal.toLocaleString('en-BD')}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Delivery Charge:</span>
                <div className="flex items-center gap-1">
                  <span>৳</span>
                  <input
                    type="number"
                    min="0"
                    name="deliveryCharge"
                    value={formData.deliveryCharge}
                    onChange={handleInputChange}
                    className="w-24 text-right px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                <span>Grand Total:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>

          </div>

          {/* 🔘 FIXED FOOTER */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={16} /> {updating ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}