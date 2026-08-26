import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";

// Product Pages
import ProductList from "./pages/products/ProductList";
import ProductForm from "./components/productsForm/ProductForm";
import Categories from "./pages/products/Categories";
import Colors from "./pages/products/Colors";
import Brands from "./pages/products/Brands";

// 🏬 Outlet Page
import Outlets from "./pages/outlets/Outlets"; 

// 💻 POS Page (নতুন যুক্ত করা হলো)
import PosSystem from "./pages/POS/PosSystem"; // 👈 আপনার ফাইলের পাথ অনুযায়ী ঠিক করে নিন

// 🛍️ Order Pages
import OrderList from "./pages/orders/OrderList";
import CreateOrder from "./pages/orders/CreateOrder";
import OrderDetails from "./pages/orders/OrderDetails";

// Auth & LockScreen
import LockScreen from "./pages/lockscreen/LockScreen";
import PrivateRoute from "./pages/firebase/PrivateRoute";

// Banner & Popups
import AllBanners from "./pages/promotions/AllBanners";
import AddBanner from "./pages/promotions/AddBanner";
import EditBanner from "./pages/promotions/EditBanner";
import Managers from "./pages/Manages/Managers";

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

          {/* 💻 POS Route */}
          <Route path="pos" element={<PosSystem />} />

          {/* 📦 Product Routes */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="products/categories" element={<Categories />} />
          <Route path="products/colors" element={<Colors />} />
          <Route path="products/brands" element={<Brands />} />

          {/* 🏬 Outlet Route */}
          <Route path="outlets" element={<Outlets />} />

          {/* 🛒 Order Routes */}
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/add" element={<CreateOrder />} />
          <Route path="orders/:id" element={<OrderDetails />} />

          {/* Promotion & Banners */}
          <Route path="promotions/banners" element={<AllBanners />} />
          <Route path="promotions/add" element={<AddBanner />} />
          <Route path="promotions/edit/:id" element={<EditBanner />} />

          {/* Manager */}
          <Route path="/managers" element={<Managers/>}/>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}