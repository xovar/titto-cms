import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// Helper: Safe Error Extractor
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// ── Order Thunks ────────────────────────────────────────────────────────────

// ⚡ Fetch All Orders (সাপোর্টস পেজিনেশন এবং ফিল্টারিং)
// ব্যবহার: dispatch(fetchOrders({ page: 1, limit: 10, status: 'pending' })) অথবা dispatch(fetchOrders('pending'))
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      // যদি স্ট্রিং হিসেবে 'pending' বা 'all' পাঠানো হয়
      const queryParams = typeof params === 'string' ? { status: params } : params;
      const { page = 1, limit = 10, status } = queryParams;

      let url = `/orders?page=${page}&limit=${limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      const response = await axiosInstance.get(url);
      return response.data; // রেসপন্স ফরম্যাট: { data: [...], pagination: {...} }
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch orders'));
    }
  }
);

// ⚡ Single Order Fetch Thunk
export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to fetch order details'));
    }
  }
);

// ⚡ Create Manual Order Thunk
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to create order'));
    }
  }
);

// ⚡ Update Order Status Thunk (HTTP Method: PUT)
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}/status`, { status });
      return { id, status, data: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update order status'));
    }
  }
);

// ⚡ Update Entire Order Thunk
export const updateOrder = createAsyncThunk(
  'orders/update',
  async ({ id, ...orderData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}`, orderData);
      return { id, updatedData: orderData, response: response.data };
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to update order details'));
    }
  }
);

// ⚡ Delete Order Thunk
export const deleteOrder = createAsyncThunk(
  'orders/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/orders/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMsg(error, 'Failed to delete order'));
    }
  }
);

// ── Slice Definition ────────────────────────────────────────────────────────

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    selectedOrder: null, // সিঙ্গেল অর্ডার দেখার জন্য
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch All Orders ──────────────────────────────────
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        // ব্যাকএন্ডের নতুন ফরম্যাট { data: [...], pagination: {...} } অনুযায়ী রিড করা
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Fetch Order By ID ─────────────────────────────────
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Create Order ──────────────────────────────────────
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Update Order Status ───────────────────────────────
      .addCase(updateOrderStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updating = false;
        const { id, status } = action.payload;
        
        // List item update
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index].status = status;
        }

        // Selected order update
        if (state.selectedOrder) {
          if (state.selectedOrder.id === id) {
            state.selectedOrder.status = status;
          } else if (state.selectedOrder.data?.id === id) {
            state.selectedOrder.data.status = status;
          }
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Update Full Order ─────────────────────────────────
      .addCase(updateOrder.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.updating = false;
        const { id, updatedData } = action.payload;

        // ১. অর্ডারের লিস্টে পরিবর্তন সিঙ্ক করা
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedData };
        }

        // ২. কারেন্ট সিলেক্টেড অর্ডারে তথ্য সিঙ্ক করা
        if (state.selectedOrder) {
          if (state.selectedOrder.id === id) {
            state.selectedOrder = { ...state.selectedOrder, ...updatedData };
          } else if (state.selectedOrder.data?.id === id) {
            state.selectedOrder.data = { ...state.selectedOrder.data, ...updatedData };
          }
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // ── Delete Order ──────────────────────────────────────
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.selectedOrder?.id === action.payload) {
          state.selectedOrder = null;
        }
      });
  },
});

export const { clearOrderError, clearSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;