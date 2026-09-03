import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import KpiCard from '../pages/dashboadComponent/Kpicard';
import SalesChart from '../pages/dashboadComponent/Saleschart';
import RecentOrders from '../pages/dashboadComponent/Recentorders';
import RecentPosOrders from '../pages/dashboadComponent/Recentposorders';

// দোকানের timezone অনুযায়ী আজকের বছর/মাস বের করা (dashboardSlice-এর সাথে সামঞ্জস্যপূর্ণ)
const getCurrentYearMonthInDhaka = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value) - 1; // 0-indexed
  return { year, month };
};

// ড্রপডাউনের জন্য শেষ ১২ মাসের লিস্ট বানানো (সবচেয়ে নতুনটা প্রথমে)
const buildMonthOptions = () => {
  const { year: curYear, month: curMonth } = getCurrentYearMonthInDhaka();
  const options = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(curYear, curMonth - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ year, month, label, value: `${year}-${month}` });
  }
  return options;
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, salesChart, recentOrders, loading } = useSelector((state) => state.dashboard);

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedValue, setSelectedValue] = useState(monthOptions[0]?.value);

  const selected = monthOptions.find((m) => m.value === selectedValue) || monthOptions[0];

  useEffect(() => {
    if (selected) {
      dispatch(fetchDashboardData({ year: selected.year, month: selected.month }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, selectedValue]);

  const isCurrentMonth = stats?.isCurrentMonth ?? true;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative min-h-[80vh]" id="dashboard-view">

      {/* Page heading + Month selector */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your store
            {isCurrentMonth ? ' today.' : ` in ${selected?.label}.`}
          </p>
        </div>

        <select
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          className="w-full sm:w-48 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={ShoppingBag}
          iconColor="blue"
          label={isCurrentMonth ? 'Total Sales' : `Sales (${selected?.label})`}
          value={stats?.totalSales?.toLocaleString() || '0'}
          subtext={`↑ ${stats?.salesGrowth || 0}% from last month`}
        />
        <KpiCard
          icon={DollarSign}
          iconColor="green"
          label={isCurrentMonth ? 'Total Revenue' : `Revenue (${selected?.label})`}
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
          subtext={`↑ ${stats?.revenueGrowth || 0}% from last month`}
        />

        {isCurrentMonth ? (
          <>
            <KpiCard
              icon={TrendingUp}
              iconColor="amber"
              label="Today's Sales"
              value={`${stats?.todaySales || 0} items`}
              subtext="Orders received today"
            />
            <KpiCard
              icon={Activity}
              iconColor="purple"
              label="Today's Revenue"
              value={`$${stats?.todayRevenue?.toLocaleString() || '0'}`}
              subtext="Daily run-rate"
            />
          </>
        ) : (
          <>
            <KpiCard
              icon={TrendingUp}
              iconColor="amber"
              label="Avg. Daily Sales"
              value={`${stats?.avgDailySales || 0} items`}
              subtext="Per day this month"
            />
            <KpiCard
              icon={Activity}
              iconColor="purple"
              label="Avg. Daily Revenue"
              value={`$${stats?.avgDailyRevenue?.toLocaleString() || '0'}`}
              subtext="Per day this month"
            />
          </>
        )}
      </div>

      {/* Sales Chart */}
      <SalesChart data={salesChart} title={selected?.label} />

      {/* Recent Orders (website checkout) */}
      <RecentOrders orders={recentOrders} />

      {/* Recent POS Sales (in-store) */}
      <RecentPosOrders orders={recentOrders} />
    </div>
  );
}