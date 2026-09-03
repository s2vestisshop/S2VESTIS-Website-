import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Route-level code splitting — keep the landing page + shell eager, lazy-load the rest.
const named = <T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  key: keyof T
) => lazy(() => loader().then((m) => ({ default: m[key] as React.ComponentType })));

const ProductsPage = named(() => import('@/pages/ProductsPage'), 'ProductsPage');
const ProductDetailPage = named(() => import('@/pages/ProductDetailPage'), 'ProductDetailPage');
const CartPage = named(() => import('@/pages/CartPage'), 'CartPage');
const WishlistPage = named(() => import('@/pages/WishlistPage'), 'WishlistPage');
const CheckoutPage = named(() => import('@/pages/CheckoutPage'), 'CheckoutPage');
const LoginPage = named(() => import('@/pages/LoginPage'), 'LoginPage');
const RegisterPage = named(() => import('@/pages/RegisterPage'), 'RegisterPage');
const AccountPage = named(() => import('@/pages/AccountPage'), 'AccountPage');

const AdminLayout = named(() => import('@/pages/admin/AdminLayout'), 'AdminLayout');
const AdminDashboardPage = named(
  () => import('@/pages/admin/AdminDashboardPage'),
  'AdminDashboardPage'
);
const AdminProductsPage = named(
  () => import('@/pages/admin/AdminProductsPage'),
  'AdminProductsPage'
);
const AdminProductFormPage = named(
  () => import('@/pages/admin/AdminProductFormPage'),
  'AdminProductFormPage'
);
const AdminCategoriesPage = named(
  () => import('@/pages/admin/AdminCategoriesPage'),
  'AdminCategoriesPage'
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
