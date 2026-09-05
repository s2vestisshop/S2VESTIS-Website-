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
const ForgotPasswordPage = named(
  () => import('@/pages/ForgotPasswordPage'),
  'ForgotPasswordPage'
);
const ResetPasswordPage = named(() => import('@/pages/ResetPasswordPage'), 'ResetPasswordPage');
const AccountPage = named(() => import('@/pages/AccountPage'), 'AccountPage');
const OrdersPage = named(() => import('@/pages/account/OrdersPage'), 'OrdersPage');
const OrderDetailPage = named(() => import('@/pages/account/OrderDetailPage'), 'OrderDetailPage');
const SizeGuidePage = named(() => import('@/pages/SizeGuidePage'), 'SizeGuidePage');

const AboutPage = named(() => import('@/pages/info/StaticPages'), 'AboutPage');
const SustainabilityPage = named(() => import('@/pages/info/StaticPages'), 'SustainabilityPage');
const StoresPage = named(() => import('@/pages/info/StaticPages'), 'StoresPage');
const ShippingReturnsPage = named(() => import('@/pages/info/StaticPages'), 'ShippingReturnsPage');
const TrackOrderPage = named(() => import('@/pages/info/StaticPages'), 'TrackOrderPage');
const PrivacyPolicyPage = named(() => import('@/pages/info/StaticPages'), 'PrivacyPolicyPage');
const TermsPage = named(() => import('@/pages/info/StaticPages'), 'TermsPage');
const ContactPage = named(() => import('@/pages/info/ContactPage'), 'ContactPage');
const FaqPage = named(() => import('@/pages/info/FaqPage'), 'FaqPage');

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
const AdminOrdersPage = named(() => import('@/pages/admin/AdminOrdersPage'), 'AdminOrdersPage');
const AdminOrderDetailPage = named(
  () => import('@/pages/admin/AdminOrderDetailPage'),
  'AdminOrderDetailPage'
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
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* content pages */}
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="shipping" element={<ShippingReturnsPage />} />
        <Route path="size-guide" element={<SizeGuidePage />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="sustainability" element={<SustainabilityPage />} />
        <Route path="track" element={<TrackOrderPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsPage />} />

        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="account/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="account/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
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
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
