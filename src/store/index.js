import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    products: productReducer,
    dashboard: dashboardReducer,
  },
});
