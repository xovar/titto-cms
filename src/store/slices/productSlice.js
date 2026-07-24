import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import products from '../../api/productApi';

// ── Async Thunks ────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await products.get('/products');
    return response.data; // কন্ট্রোলার formattedProducts অ্যারে রিটার্ন করে
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to fetch products');
  }
});

export const addProduct = createAsyncThunk('products/add', async (productData, { rejectWithValue }) => {
  try {
    const response = await products.post('/products', productData);
    // কন্ট্রোলার রেসপন্সে পাঠায়: { message: "...", productId: "prod_xxx" }
    // আমরা ফ্রন্টঅ্যান্ড UI স্টেট ম্যানেজমেন্টের সুবিধার্থে আইডিসহ মূল ডাটাটি রিটার্ন করছি
    return {
      id: response.data.productId,
      ...productData,
      viewed: 0,
      sold: 0
    };
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to add product');
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (productId, { rejectWithValue }) => {
  try {
    await products.delete(`/products/${productId}`);
    return productId;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to delete product');
  }
});

// ── Category Thunks ─────────────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await products.get('/categories');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to fetch categories');
  }
});

export const addCategory = createAsyncThunk('products/addCategory', async (data, { rejectWithValue }) => {
  try {
    const response = await products.post('/categories', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to add category');
  }
});

export const deleteCategory = createAsyncThunk('products/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    await products.delete(`/categories/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to delete category');
  }
});

// ── Brand Thunks ────────────────────────────────────────────────────────────

export const fetchBrands = createAsyncThunk('products/fetchBrands', async (_, { rejectWithValue }) => {
  try {
    const response = await products.get('/brands');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to fetch brands');
  }
});

export const addBrand = createAsyncThunk('products/addBrand', async (data, { rejectWithValue }) => {
  try {
    const response = await products.post('/brands', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to add brand');
  }
});

export const deleteBrand = createAsyncThunk('products/deleteBrand', async (id, { rejectWithValue }) => {
  try {
    await products.delete(`/brands/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to delete brand');
  }
});

// ── Color Thunks ────────────────────────────────────────────────────────────

export const fetchColors = createAsyncThunk('products/fetchColors', async (_, { rejectWithValue }) => {
  try {
    const response = await products.get('/colors');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to fetch colors');
  }
});

export const addColor = createAsyncThunk('products/addColor', async (data, { rejectWithValue }) => {
  try {
    const response = await products.post('/colors', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to add color');
  }
});

export const deleteColor = createAsyncThunk('products/deleteColor', async (id, { rejectWithValue }) => {
  try {
    await products.delete(`/colors/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to delete color');
  }
});

// ── Slice ───────────────────────────────────────────────────────────────────

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
        state.items.unshift(action.payload); // ফিক্সড পেলোড অবজেক্ট যুক্ত হবে
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        // কন্ট্রোলারের 'id' প্রোপার্টির সাথে ম্যাচ করে ক্লীন ফিল্টারিং
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