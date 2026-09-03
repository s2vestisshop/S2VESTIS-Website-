import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Toaster } from '@/components/ui/Toaster';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { PageFallback } from '@/components/common/PageFallback';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <Toaster />
    </div>
  );
}
