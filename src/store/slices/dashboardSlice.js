import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor (একই প্যাটার্ন orderSlice/productSlice এর মতো)
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// দোকানের timezone সবসময় Asia/Dhaka ধরা হচ্ছে — admin যেই device/timezone থেকেই
// লগইন করুক না কেন, "আজ"/মাসের হিসাব সবসময় বাংলাদেশের ক্যালেন্ডার অনুযায়ী হবে।
const DASHBOARD_TZ = 'Asia/Dhaka';

// 'YYYY-MM-DD' ফরম্যাটে দিন বের করার হেল্পার (নির্দিষ্ট timezone অনুযায়ী, browser-independent)
const toDateKey = (dateInput, timeZone = DASHBOARD_TZ) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
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

// নির্দিষ্ট বছর/মাসে কয়দিন আছে (month 0-indexed)
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const isCancelled = (order) => order.status === 'cancelled';

// একটা order থেকে revenue বের করা (price + deliveryCharge, cancelled বাদ দিয়ে হিসেব হবে caller-এ)
const orderAmount = (order) => {
  const price = Number(order.price) || 0;
  const delivery = Number(order.deliveryCharge) || 0;
  return price + delivery;
};

// ── Thunk: নির্দিষ্ট মাসের dashboard ডেটা বানানো ────────────────────────────
// payload: { year, month } — month 0-indexed (জানুয়ারি=0)। না দিলে আজকের মাস ধরা হবে।
// ব্যাকএন্ডে আলাদা /dashboard এন্ডপয়েন্ট নেই ধরে নিয়ে, /orders থেকে ডেটা টেনে
// client-side এ stats/chart/recent-orders calculate করা হচ্ছে।
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (payload, { rejectWithValue }) => {
    try {
      const now = new Date();
      const currentYM = getYearMonthInTZ(now);

      const year = payload?.year ?? currentYM.year;
      const month = payload?.month ?? currentYM.month;

      const isCurrentMonth = year === currentYM.year && month === currentYM.month;
      const todayKey = isCurrentMonth ? toDateKey(now) : null;

      // আগের মাস (growth তুলনার জন্য) — বছর বদলের ক্ষেত্রেও ঠিক থাকবে
      const prevMonthDate = new Date(Date.UTC(year, month - 1, 1));
      const { year: prevYear, month: prevMonth } = getYearMonthInTZ(prevMonthDate);

      // বড় রেঞ্জের অর্ডার একবারে টেনে আনা (ব্যাকএন্ডে limit বেশি না দিলে
      // pagination.total অনুযায়ী পরে loop করে আরও পেজ টানার প্রয়োজন হতে পারে)
      const response = await axiosInstance.get('/orders?page=1&limit=1000&sort=-created_at');
      const allOrders = response.data?.data || [];

      // ── Selected month-এর অর্ডার আলাদা করা ──────────────────────────────
      const monthOrders = [];
      let prevMonthRevenue = 0;
      let prevMonthSales = 0;

      allOrders.forEach((order) => {
        const { year: oYear, month: oMonth } = getYearMonthInTZ(order.createdAt);
        if (oYear === year && oMonth === month) {
          monthOrders.push(order);
        } else if (oYear === prevYear && oMonth === prevMonth) {
          prevMonthSales += 1;
          if (!isCancelled(order)) prevMonthRevenue += orderAmount(order);
        }
      });

      // ── সিলেক্টেড মাসের প্রতিদিনের bucket বানানো ─────────────────────────
      const totalDays = daysInMonth(year, month);
      const chartMap = new Map();
      for (let day = 1; day <= totalDays; day += 1) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        chartMap.set(key, { date: key, label: String(day), sales: 0, revenue: 0 });
      }

      let totalRevenue = 0;
      let todaySales = 0;
      let todayRevenue = 0;

      monthOrders.forEach((order) => {
        const dateKey = toDateKey(order.createdAt);
        const cancelled = isCancelled(order);
        const amount = orderAmount(order);

        if (!cancelled) totalRevenue += amount;

        if (todayKey && dateKey === todayKey) {
          todaySales += 1;
          if (!cancelled) todayRevenue += amount;
        }

        if (dateKey && chartMap.has(dateKey)) {
          const bucket = chartMap.get(dateKey);
          bucket.sales += 1;
          if (!cancelled) bucket.revenue += amount;
        }
      });

      // মাসের যতদিন পার হয়েছে তার গড় (চলতি মাস হলে আজ পর্যন্ত, নয়তো পুরো মাস)
      const elapsedDays = isCurrentMonth ? new Date(now.toLocaleString('en-US', { timeZone: DASHBOARD_TZ })).getDate() : totalDays;
      const avgDailySales = elapsedDays > 0 ? Math.round((monthOrders.length / elapsedDays) * 10) / 10 : 0;
      const avgDailyRevenue = elapsedDays > 0 ? Math.round((totalRevenue / elapsedDays) * 100) / 100 : 0;

      // % গ্রোথ ক্যালকুলেশন (আগের মাসে ডেটা না থাকলে 0/100% দেখানো হবে, divide-by-zero এড়াতে)
      const pctGrowth = (current, previous) => {
        if (!previous) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const stats = {
        isCurrentMonth,
        totalSales: monthOrders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todaySales,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        avgDailySales,
        avgDailyRevenue,
        salesGrowth: pctGrowth(monthOrders.length, prevMonthSales),
        revenueGrowth: pctGrowth(totalRevenue, prevMonthRevenue),
      };

      const salesChart = Array.from(chartMap.values());

      const recentOrders = [...monthOrders]
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

      return { year, month, stats, salesChart, recentOrders };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to load dashboard data'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    selectedYear: null,
    selectedMonth: null,
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
        state.selectedYear = action.payload.year;
        state.selectedMonth = action.payload.month;
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