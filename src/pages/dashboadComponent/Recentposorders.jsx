import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOutlets } from '../../store/slices/outletSlice';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  processing: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  shipped: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  delivered: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' });
};

// ডুপ্লিকেট নাম (যেমন: "jamal uddin jamal uddin") ফিক্স করার হেলপার ফাংশন
// RecentOrders.jsx-এর মতোই — POS sale-এও walk-in/registered কাস্টমারের
// নামে একই সমস্যা হতে পারে।
const formatCustomerName = (name) => {
  if (!name) return 'Walk-in Customer';

  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);

  // যদি শব্দের সংখ্যা জোড় হয় এবং ১ম ও ২য় ভাগ হুবহু মিলে যায়
  if (words.length > 1 && words.length % 2 === 0) {
    const halfLength = words.length / 2;
    const firstHalf = words.slice(0, halfLength).join(' ');
    const secondHalf = words.slice(halfLength).join(' ');

    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      return firstHalf;
    }
  }

  return trimmedName;
};

// RecentOrders.jsx-এর মতোই dashboardSlice.fetchDashboardData থেকে আসা
// অর্ডার list ব্যবহার করে, কিন্তু শুধু channel: 'pos' (in-store sale)
// ফিল্টার করে দেখায়। প্রতিটি অর্ডার: { id, customerName, status, channel,
// amount, outletId, createdAt }
//
// 🔗 dashboard endpoint outlet_name পাঠায় না (শুধু outlet_id) — তাই নাম
// resolve করা হচ্ছে outletSlice-এর state.outlets.items থেকে, id দিয়ে
// match করে। outlets ইতিমধ্যে fetch করা না থাকলে এখানেই fetchOutlets()
// dispatch করা হয়।
export default function RecentPosOrders({ orders = [] }) {
  const dispatch = useDispatch();
  const { items: outlets, loading: loadingOutlets } = useSelector((state) => state.outlets);

  useEffect(() => {
    if (!outlets || outlets.length === 0) {
      dispatch(fetchOutlets());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // outlet_id -> outlet_name lookup map — প্রতিবার orders/outlets বদলালে রিবিল্ড হয়
  const outletNameById = useMemo(() => {
    const map = {};
    (outlets || []).forEach((o) => {
      map[String(o.outlet_id)] = o.outlet_name;
    });
    return map;
  }, [outlets]);

  const getOutletName = (order) => {
    if (!order.outletId) return '—';
    return outletNameById[String(order.outletId)] || (loadingOutlets ? '...' : '—');
  };

  // 🔗 এই widget-এ শুধু POS sale (channel: 'pos') দেখানো হয় — website
  // checkout (channel: 'online') বাদ, সেটা RecentOrders.jsx-এ দেখানো হয়।
  const posOrders = orders.filter((order) => order.channel === 'pos');

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
          Recent POS Sales
        </h2>
        <a
          href="/orders?channel=pos"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </a>
      </div>

      {posOrders.length === 0 ? (
        <div className="py-10 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          কোনো সাম্প্রতিক POS বিক্রি নেই
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-secondary-light dark:text-text-secondary-dark border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 font-medium">Sale</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Outlet</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {posOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="px-4 py-3">
                    <a
                      href={order.id ? `/orders/${order.id}` : '#'}
                      className="font-medium text-text-primary-light dark:text-text-primary-dark hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      #{order.id ? String(order.id).slice(-8) : '—'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-text-secondary-light dark:text-text-secondary-dark capitalize">
                    {formatCustomerName(order.customerName)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary-light dark:text-text-secondary-dark">
                    {getOutletName(order)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary-light dark:text-text-primary-dark">
                    ৳{Number(order.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary-light dark:text-text-secondary-dark">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

RecentPosOrders.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      customerName: PropTypes.string,
      status: PropTypes.string,
      channel: PropTypes.string,
      amount: PropTypes.number,
      outletId: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
};