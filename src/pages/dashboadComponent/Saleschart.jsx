import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// dashboardSlice.fetchDashboardData থেকে আসা প্রতিটি পয়েন্ট:
// { date: 'YYYY-MM-DD', label: 'Mon', sales: number, revenue: number }
export default function SalesChart({ data = [] }) {
  const hasData = data.some((d) => d.sales > 0 || d.revenue > 0);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
          Sales Overview
        </h2>
        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Last 7 days
        </span>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          এখনো কোনো অর্ডার নেই এই সপ্তাহে
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="currentColor"
                opacity={0.6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="currentColor"
                opacity={0.6}
                tickFormatter={(v) => `$${v}`}
                width={48}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders',
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

SalesChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      label: PropTypes.string,
      sales: PropTypes.number,
      revenue: PropTypes.number,
    })
  ),
};