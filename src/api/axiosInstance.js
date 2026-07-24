// ── Axios Instance with Mock Interceptors ───────────────────────────────────
// All API calls route through this instance.
// Mock interceptors simulate backend responses using seed data.
// To connect a real backend: remove the interceptors and set baseURL.

import axios from 'axios';
import {
  mockProducts,
  mockCategories,
  mockBrands,
  mockColors,
  mockDashboardStats,
  mockSalesChart,
  mockRecentOrders,
} from './mockData';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── In-memory stores (mutable copies of seed data) ──────────────────────────
let products = [...mockProducts];
let categories = [...mockCategories];
let brands = [...mockBrands];
let colors = [...mockColors];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ── Request Interceptor (mock router) ───────────────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  await delay(200 + Math.random() * 300);

  const { method, url, data } = config;
  let responseData = null;
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

  // ── Products ──
  if (url === '/products' && method === 'get') {
    responseData = products;
  } else if (url === '/products' && method === 'post') {
    const newProduct = { id: uid('prod'), ...parsedData };
    // Resolve category/brand/color refs
    if (parsedData.categoryId) {
      newProduct.category = categories.find((c) => c.id === parsedData.categoryId) || { id: parsedData.categoryId, name: 'Unknown' };
    }
    if (parsedData.brandId) {
      newProduct.brand = brands.find((b) => b.id === parsedData.brandId) || { id: parsedData.brandId, name: 'Unknown' };
    }
    if (parsedData.variants) {
      newProduct.variants = parsedData.variants.map((v) => ({
        id: uid('var'),
        color: colors.find((c) => c.id === v.colorId) || { id: v.colorId, name: 'Unknown', code: '#888' },
        images: v.images || [],
        sizes: (v.sizes || []).map((s) => ({ id: uid('size'), ...s })),
      }));
    }
    newProduct.viewed = 0;
    newProduct.sold = 0;
    products.unshift(newProduct);
    responseData = newProduct;
  } else if (url?.match(/^\/products\//) && method === 'delete') {
    const id = url.split('/').pop();
    products = products.filter((p) => p.id !== id);
    responseData = { success: true };
  }

  // ── Categories ──
  else if (url === '/categories' && method === 'get') {
    responseData = categories;
  } else if (url === '/categories' && method === 'post') {
    const newCat = { id: uid('cat'), name: parsedData.name };
    categories.push(newCat);
    responseData = newCat;
  } else if (url?.match(/^\/categories\//) && method === 'delete') {
    const id = url.split('/').pop();
    categories = categories.filter((c) => c.id !== id);
    responseData = { success: true };
  }

  // ── Brands ──
  else if (url === '/brands' && method === 'get') {
    responseData = brands;
  } else if (url === '/brands' && method === 'post') {
    const newBrand = { id: uid('bra'), name: parsedData.name };
    brands.push(newBrand);
    responseData = newBrand;
  } else if (url?.match(/^\/brands\//) && method === 'delete') {
    const id = url.split('/').pop();
    brands = brands.filter((b) => b.id !== id);
    responseData = { success: true };
  }

  // ── Colors ──
  else if (url === '/colors' && method === 'get') {
    responseData = colors;
  } else if (url === '/colors' && method === 'post') {
    const newColor = { id: uid('col'), name: parsedData.name, code: parsedData.code };
    colors.push(newColor);
    responseData = newColor;
  } else if (url?.match(/^\/colors\//) && method === 'delete') {
    const id = url.split('/').pop();
    colors = colors.filter((c) => c.id !== id);
    responseData = { success: true };
  }

  // ── Dashboard ──
  else if (url === '/dashboard' && method === 'get') {
    responseData = {
      stats: mockDashboardStats,
      salesChart: mockSalesChart,
      recentOrders: mockRecentOrders,
    };
  }

  if (responseData !== null) {
    // Short-circuit: return a mock response via adapter override
    config.adapter = () =>
      Promise.resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
  }

  return config;
});

export default axiosInstance;
