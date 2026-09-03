import PropTypes from 'prop-types';

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

// dashboardSlice.fetchDashboardData থেকে আসা প্রতিটি অর্ডার:
// { id, customerName, status, channel, amount, outletId, createdAt }
export default function RecentOrders({ orders = [] }) {
  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
          Recent Orders
        </h2>
        <a
          href="/orders"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all
        </a>
      </div>

      {orders.length === 0 ? (
        <div className="py-10 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          কোনো সাম্প্রতিক অর্ডার নেই
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-secondary-light dark:text-text-secondary-dark border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
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
                  <td className="px-4 py-3 text-text-secondary-light dark:text-text-secondary-dark">
                    {order.customerName}
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
                    ${Number(order.amount || 0).toLocaleString()}
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

RecentOrders.propTypes = {
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