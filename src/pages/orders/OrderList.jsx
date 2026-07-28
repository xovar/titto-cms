import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// ⚠️ আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী orderSlice-এর সঠিক Path দিন
import { fetchOrders, deleteOrder } from '../../store/slices/orderSlice';
import {
  Search,
  Eye,
  Trash2,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Package,
  AlertCircle,
} from 'lucide-react';

export default function OrderList() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  const [searchTerm, setSearchTerm] = useState('');

  // 1️⃣ Redux Store থেকে State নিয়ে আসা
  const { items, loading, error } = useSelector((state) => state.orders);

  // 2️⃣ URL-এর status পরিবর্তন হলে বা পেজ লোড হলে Redux Action Dispatch করা
  useEffect(() => {
    dispatch(fetchOrders(currentStatus));
  }, [dispatch, currentStatus]);

  // 🗑️ Redux এর মাধ্যমে অর্ডার ডিলিট
  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete Order #${id}?`)) {
      dispatch(deleteOrder(id));
    }
  };

  // 💡 Safe Array Extractor (যদি ব্যাকএন্ড থেকে Array-এর বদলে Object আসে)
  const safeOrdersList = Array.isArray(items)
    ? items
    : items?.orders || items?.data || [];

  // 🔍 সার্চ ফিল্টারিং (Client-side Search)
  const filteredOrders = safeOrdersList.filter((order) => {
    const firstName = order.first_name || order.firstName || '';
    const lastName = order.last_name || order.lastName || '';
    const name = `${firstName} ${lastName}`.toLowerCase();
    const phone = order.phone || '';
    const orderId = order.id?.toString().toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return orderId.includes(search) || name.includes(search) || phone.includes(search);
  });

  // 🎨 Status Badge Helper
  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      shipped: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      cancelled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    };

    const icons = {
      pending: <Clock size={13} />,
      processing: <RefreshCw size={13} className="animate-spin" />,
      shipped: <Truck size={13} />,
      delivered: <CheckCircle2 size={13} />,
      cancelled: <XCircle size={13} />,
    };

    const key = status?.toLowerCase() || 'pending';

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${
          statusClasses[key] || statusClasses.pending
        }`}
      >
        {icons[key]}
        {status || 'Pending'}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 🟢 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Order Management
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Manage and track all customer orders
          </p>
        </div>
        <Link
          to="/orders/add"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-brand hover:opacity-90 text-white font-medium rounded-lg transition-all shadow-sm text-sm"
        >
          + Create New Order
        </Link>
      </div>

      {/* ⚠️ Redux Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 📊 Status Tabs & Search */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-light dark:border-border-dark text-sm scrollbar-none">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(
            (tab) => (
              <button
                key={tab}
                onClick={() =>
                  setSearchParams(tab === 'all' ? {} : { status: tab })
                }
                className={`px-3.5 py-1.5 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${
                  currentStatus === tab
                    ? 'bg-accent-brand/10 text-accent-brand font-semibold'
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-background-light dark:hover:bg-background-dark'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Search & Refresh */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
            />
            <input
              type="text"
              placeholder="Search by ID, Name or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
            />
          </div>

          <button
            onClick={() => dispatch(fetchOrders(currentStatus))}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-all text-text-secondary-light dark:text-text-secondary-dark w-full sm:w-auto justify-center"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 📋 Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-accent-brand" />
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <Package size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium text-base">No orders found</p>
            <p className="text-xs mt-1">Try changing your search terms or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filteredOrders.map((order) => {
                  const price = parseFloat(order.price || order.total || 0);
                  const deliveryCharge = parseFloat(order.delivery_charge || 0);
                  const totalPrice = price + deliveryCharge;

                  const firstName = order.first_name || order.firstName || 'Customer';
                  const lastName = order.last_name || order.lastName || '';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold text-accent-brand">
                        #{order.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {firstName} {lastName}
                        </div>
                        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {order.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-primary-light dark:text-text-primary-dark">
                        ৳{totalPrice.toLocaleString('en-BD')}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-5 py-4 text-xs text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex p-1.5 rounded-md hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-accent-brand transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>

                        <button
                          onClick={() => handleDelete(order.id)}
                          className="inline-flex p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 size={18} />
                        </button>
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