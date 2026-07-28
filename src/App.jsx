import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';

// Product Pages
import ProductList from './pages/products/ProductList';
import ProductForm from './components/productsForm/ProductForm';
import Categories from './pages/products/Categories';
import Colors from './pages/products/Colors';
import Brands from './pages/products/Brands';

// 🛍️ Order Pages (এগুলো আপনার `src/pages/orders/` ফোল্ডারে থাকতে হবে)
import OrderList from './pages/orders/OrderList'; // 👈 Import OrderList
import CreateOrder from './pages/orders/CreateOrder'; // 👈 Import CreateOrder
import OrderDetails from './pages/orders/OrderDetails'; // 👈 Import OrderDetails (যদি সিঙ্গেল অর্ডার দেখতে চান)

// Auth & LockScreen
import LockScreen from './pages/lockscreen/LockScreen';
import PrivateRoute from './pages/firebase/PrivateRoute';

export default function App() {
  return (
    <Routes>
      {/* 🔓 Public Route (Login/LockScreen) */}
      <Route path="/lock-screen" element={<LockScreen />} />

      {/* 🔒 Protected / Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* 📦 Product Routes */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="products/categories" element={<Categories />} />
          <Route path="products/colors" element={<Colors />} />
          <Route path="products/brands" element={<Brands />} />

          {/* 🛒 Order Routes (নতুন যুক্ত করা হলো) */}
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/add" element={<CreateOrder />} />
          <Route path="orders/:id" element={<OrderDetails />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}