import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; // 👈 axiosApi-এর বদলে আপনার তৈরি করা axiosInstance ব্যবহার করা হলো

// ── Helper: Safe Error Extractor (UI Crash প্রতিরোধ করতে) ────────────────────
const extractErrorMsg = (error, defaultMsg) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (typeof error.response?.data === 'string') return error.response.data;
  return error.message || defaultMsg;
};

// ── Product Thunks ──────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/products');
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch products'));
  }
});

export const addProduct = createAsyncThunk('products/add', async (productData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/products', productData);
    return {
      id: response.data.productId,
      ...productData,
      viewed: 0,
      sold: 0
    };
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add product'));
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (productId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/products/${productId}`);
    return productId;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete product'));
  }
});

// ── Category Thunks ─────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/categories');
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch categories'));
  }
});

export const addCategory = createAsyncThunk('products/addCategory', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/categories', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add category'));
  }
});

export const deleteCategory = createAsyncThunk('products/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/categories/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete category'));
  }
});

// ── Brand Thunks ────────────────────────────────────────────────────────────

export const fetchBrands = createAsyncThunk('products/fetchBrands', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/brands');
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch brands'));
  }
});

export const addBrand = createAsyncThunk('products/addBrand', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/brands', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add brand'));
  }
});

export const deleteBrand = createAsyncThunk('products/deleteBrand', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/brands/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete brand'));
  }
});

// ── Color Thunks ────────────────────────────────────────────────────────────

export const fetchColors = createAsyncThunk('products/fetchColors', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/colors');
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to fetch colors'));
  }
});

export const addColor = createAsyncThunk('products/addColor', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/colors', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to add color'));
  }
});

export const deleteColor = createAsyncThunk('products/deleteColor', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/colors/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMsg(error, 'Failed to delete color'));
  }
});

// ── Slice Definition ────────────────────────────────────────────────────────

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    categories: [],
    brands: [],
    colors: [],
    
    loading: {
      products: false,
      categories: false,
      brands: false,
      colors: false,
    },
    error: {
      products: null,
      categories: null,
      brands: null,
      colors: null,
    },
  },
  reducers: {
    clearError: (state, action) => {
      const target = action.payload;
      if (state.error[target] !== undefined) {
        state.error[target] = null;
      } else {
        state.error = { products: null, categories: null, brands: null, colors: null };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Products ──────────────────────────────────────────
      .addCase(fetchProducts.pending, (state) => { 
        state.loading.products = true; 
        state.error.products = null; 
      })
      .addCase(fetchProducts.fulfilled, (state, action) => { 
        state.loading.products = false; 
        state.items = action.payload; 
      })
      .addCase(fetchProducts.rejected, (state, action) => { 
        state.loading.products = false; 
        state.error.products = action.payload; 
      })
      .addCase(addProduct.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => { 
        state.loading.products = false;
        state.items.unshift(action.payload);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })

      // ── Categories ────────────────────────────────────────
      .addCase(fetchCategories.pending, (state) => { 
        state.loading.categories = true; 
        state.error.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => { 
        state.loading.categories = false; 
        state.categories = action.payload; 
      })
      .addCase(fetchCategories.rejected, (state, action) => { 
        state.loading.categories = false; 
        state.error.categories = action.payload; 
      })
      .addCase(addCategory.fulfilled, (state, action) => { 
        state.categories.push(action.payload); 
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      })

      // ── Brands ────────────────────────────────────────────
      .addCase(fetchBrands.pending, (state) => { 
        state.loading.brands = true; 
        state.error.brands = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => { 
        state.loading.brands = false; 
        state.brands = action.payload; 
      })
      .addCase(fetchBrands.rejected, (state, action) => { 
        state.loading.brands = false; 
        state.error.brands = action.payload; 
      })
      .addCase(addBrand.fulfilled, (state, action) => { 
        state.brands.push(action.payload); 
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.brands = state.brands.filter((b) => b.id !== action.payload);
      })

      // ── Colors ────────────────────────────────────────────
      .addCase(fetchColors.pending, (state) => { 
        state.loading.colors = true; 
        state.error.colors = null;
      })
      .addCase(fetchColors.fulfilled, (state, action) => { 
        state.loading.colors = false; 
        state.colors = action.payload; 
      })
      .addCase(fetchColors.rejected, (state, action) => { 
        state.loading.colors = false; 
        state.error.colors = action.payload; 
      })
      .addCase(addColor.fulfilled, (state, action) => { 
        state.colors.push(action.payload); 
      })
      .addCase(deleteColor.fulfilled, (state, action) => {
        state.colors = state.colors.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearError } = productSlice.actions;
export default productSlice.reducer;