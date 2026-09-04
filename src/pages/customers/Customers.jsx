import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers } from '../../store/slices/customerSlice';
import { fetchOrders } from '../../store/slices/orderSlice';
import CustomerModal from './CustomerModal'; // 👈 ১. একই ফোল্ডার থেকে CustomerModal লিংক করা হলো
import {
  Search,
  Eye,
  RefreshCw,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';

export default function Customers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const [searchTerm, setSearchTerm] = useState('');

  // 👁️ ২. Selected Customer Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Search Debounce
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setDebouncedSearch(searchTerm);
  }, [searchTerm]);

  const { items: customers = [], pagination, loading: customersLoading, error } = useSelector((state) => state.customers);
  const { items: orders = [], loading: ordersLoading } = useSelector((state) => state.orders);

  // Fetch Customers & Orders
  useEffect(() => {
    dispatch(fetchCustomers({ page: currentPage, limit: 20, search: debouncedSearch }));
    dispatch(fetchOrders({ limit: 1000 }));
  }, [dispatch, currentPage, debouncedSearch]);

  // Customer Stats Map
  const customerStatsMap = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      if (order.status?.toLowerCase() === 'cancelled') return;

      const customerId = order.customerId || order.customer?.id || order.customer?._id || order.userId;
      const customerPhone = order.phone || order.customer?.phone || order.customerPhone;
      const price = Number(order.totalAmount || order.price || order.grandTotal || 0);

      if (customerId) {
        if (!map[customerId]) map[customerId] = { totalOrders: 0, totalSpent: 0 };
        map[customerId].totalOrders += 1;
        map[customerId].totalSpent += price;
      }

      if (customerPhone) {
        if (!map[customerPhone]) map[customerPhone] = { totalOrders: 0, totalSpent: 0 };
        map[customerPhone].totalOrders += 1;
        map[customerPhone].totalSpent += price;
      }
    });

    return map;
  }, [orders]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage);
      setSearchParams(newParams);
    }
  };

  const isDataLoading = customersLoading || ordersLoading;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Customers
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Everyone who has bought from your store, online or in-store
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Refresh */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
            />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
            />
          </div>

          <button
            onClick={() => {
              dispatch(fetchCustomers({ page: currentPage, limit: 20, search: debouncedSearch }));
              dispatch(fetchOrders({ limit: 1000 }));
            }}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-all text-text-secondary-light dark:text-text-secondary-dark w-full sm:w-auto justify-center"
          >
            <RefreshCw size={14} className={isDataLoading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
        {isDataLoading ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-accent-brand" />
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <Users size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium text-base">No customers found</p>
            <p className="text-xs mt-1">Try changing your search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Total Orders</th>
                  <th className="px-5 py-3.5">Total Spent</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {customers.map((customer) => {
                  const customerId = customer.id || customer._id;
                  const customerPhone = customer.phone;

                  const stats =
                    customerStatsMap[customerId] ||
                    customerStatsMap[customerPhone] ||
                    {};

                  const totalOrders = customer.totalOrders ?? stats.totalOrders ?? 0;
                  const totalSpent = customer.totalSpent ?? stats.totalSpent ?? 0;

                  return (
                    <tr
                      key={customerId}
                      className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {customer.name || 'Unknown'}
                        </div>
                        {customer.email && (
                          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-accent-brand shrink-0" />
                          {customer.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-primary-light dark:text-text-primary-dark">
                        {totalOrders}
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-primary-light dark:text-text-primary-dark font-mono">
                        ৳{Number(totalSpent).toLocaleString('en-BD')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* 👁️ ৩. বাটন ক্লিকে মোডালে ডেটা পাঠানো হচ্ছে */}
                        <button
                          onClick={() =>
                            setSelectedCustomer({
                              ...customer,
                              totalOrders,
                              totalSpent,
                            })
                          }
                          className="inline-flex cursor-pointer p-1.5 rounded-md hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-accent-brand transition-colors"
                          title="View Quick Profile"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            <div>
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> (Total{' '}
              <span className="font-semibold">{pagination.total}</span> customers)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🟢 ৪. CustomerModal কম্পোনেন্ট রেন্ডার ও লিঙ্ক করা হলো */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}