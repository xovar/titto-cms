import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import dashboardReducer from './slices/dashboardSlice';
import orderReducer from "./slices/orderSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    products: productReducer,
    dashboard: dashboardReducer,
    orders: orderReducer,
  },
});
