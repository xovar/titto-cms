import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor (একই প্যাটার্ন orderSlice/productSlice এর মতো)
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// দোকানের timezone সবসময় Asia/Dhaka ধরা হচ্ছে — admin যেই device/timezone থেকেই
// লগইন করুক না কেন, "আজ" মানে বাংলাদেশের আজকের দিন, viewer-এর browser timezone নয়।
const DASHBOARD_TZ = 'Asia/Dhaka';

// 'YYYY-MM-DD' ফরম্যাটে দিন বের করার হেল্পার (নির্দিষ্ট timezone অনুযায়ী, browser-independent)
const toDateKey = (dateInput, timeZone = DASHBOARD_TZ) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  // en-CA locale সরাসরি YYYY-MM-DD ফরম্যাট দেয়
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

// নির্দিষ্ট timezone অনুযায়ী বছর ও মাস (0-indexed, getMonth()-এর মতো) বের করা
const getYearMonthInTZ = (dateInput, timeZone = DASHBOARD_TZ) => {
  const d = new Date(dateInput);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value) - 1;
  return { year, month };
};

const isCancelled = (order) => order.status === 'cancelled';

// একটা order থেকে revenue বের করা (price + delivery_charge, cancelled বাদ দিয়ে হিসেব হবে caller-এ)
const orderAmount = (order) => {
  const price = Number(order.price) || 0;
  const delivery = Number(order.deliveryCharge) || 0;
  return price + delivery;
};

// ── Thunk: সব dashboard ডেটা এক জায়গায় বানানো ──────────────────────────────
// ব্যাকএন্ডে আলাদা /dashboard এন্ডপয়েন্ট নেই ধরে নিয়ে, /orders থেকে ডেটা টেনে
// client-side এ stats/chart/recent-orders calculate করা হচ্ছে।
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      // বড় রেঞ্জের অর্ডার একবারে টেনে আনা (ব্যাকএন্ডে limit বেশি না দিলে
      // pagination.total অনুযায়ী পরে loop করে আরও পেজ টানার প্রয়োজন হতে পারে)
      const response = await axiosInstance.get('/orders?page=1&limit=1000&sort=-created_at');
      const orders = response.data?.data || [];
      const pagination = response.data?.pagination;

      const now = new Date();
      const todayKey = toDateKey(now);

      const { year: thisYear, month: thisMonth } = getYearMonthInTZ(now);
      const lastMonthDate = new Date(Date.UTC(thisYear, thisMonth - 1, 1));
      const { year: lastMonthYear, month: lastMonth } = getYearMonthInTZ(lastMonthDate);

      let totalRevenue = 0;
      let todaySales = 0;
      let todayRevenue = 0;
      let thisMonthRevenue = 0;
      let thisMonthSales = 0;
      let lastMonthRevenue = 0;
      let lastMonthSales = 0;

      // শেষ ৭ দিনের chart-এর জন্য বাকেট বানানো (Asia/Dhaka ক্যালেন্ডার দিন অনুযায়ী)
      const chartDays = 7;
      const chartMap = new Map();
      for (let i = chartDays - 1; i >= 0; i -= 1) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = toDateKey(d);
        chartMap.set(key, {
          date: key,
          label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: DASHBOARD_TZ }),
          sales: 0,
          revenue: 0,
        });
      }

      orders.forEach((order) => {
        const dateKey = toDateKey(order.createdAt);
        const cancelled = isCancelled(order);
        const amount = orderAmount(order);

        // Total revenue: cancelled অর্ডার বাদ দিয়ে হিসেব করা হচ্ছে
        if (!cancelled) {
          totalRevenue += amount;
        }

        if (dateKey === todayKey) {
          todaySales += 1;
          if (!cancelled) todayRevenue += amount;
        }

        if (dateKey) {
          const { year: orderYear, month: orderMonth } = getYearMonthInTZ(order.createdAt);

          if (orderMonth === thisMonth && orderYear === thisYear) {
            thisMonthSales += 1;
            if (!cancelled) thisMonthRevenue += amount;
          } else if (orderMonth === lastMonth && orderYear === lastMonthYear) {
            lastMonthSales += 1;
            if (!cancelled) lastMonthRevenue += amount;
          }
        }

        // Chart bucket-এ যোগ করা (শুধু শেষ ৭ দিনের মধ্যে হলে)
        if (dateKey && chartMap.has(dateKey)) {
          const bucket = chartMap.get(dateKey);
          bucket.sales += 1;
          if (!cancelled) bucket.revenue += amount;
        }
      });

      // % গ্রোথ ক্যালকুলেশন (আগের মাসে ডেটা না থাকলে 0 দেখানো হবে, divide-by-zero এড়াতে)
      const pctGrowth = (current, previous) => {
        if (!previous) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const stats = {
        totalSales: pagination?.total ?? orders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todaySales,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        salesGrowth: pctGrowth(thisMonthSales, lastMonthSales),
        revenueGrowth: pctGrowth(thisMonthRevenue, lastMonthRevenue),
      };

      const salesChart = Array.from(chartMap.values());

      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((order) => ({
          id: order.id,
          customerName: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Unknown',
          status: order.status,
          channel: order.channel,
          amount: orderAmount(order),
          outletId: order.outletId,
          createdAt: order.createdAt,
        }));

      return { stats, salesChart, recentOrders };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to load dashboard data'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    salesChart: [],
    recentOrders: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.salesChart = action.payload.salesChart;
        state.recentOrders = action.payload.recentOrders;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;