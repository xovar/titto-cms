import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import AddProduct from './pages/products/AddProduct';
import Categories from './pages/products/Categories';
import Colors from './pages/products/Colors';
import Brands from './pages/products/Brands';
import LockScreen from './pages/lockscreen/LockScreen';
import PrivateRoute from './pages/firebase/PrivateRoute'; // 👈 Import PrivateRoute

export default function App() {
  return (
    <Routes>
      {/* 🔓 Public Route (Login/LockScreen) */}
      <Route path="/lock-screen" element={<LockScreen />} />

      {/* 🔒 Protected / Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/categories" element={<Categories />} />
          <Route path="products/colors" element={<Colors />} />
          <Route path="products/brands" element={<Brands />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}