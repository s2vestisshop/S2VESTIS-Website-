import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="container-page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-7xl font-bold text-ink-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">This page went out of stock</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        The page you're after doesn't exist or has moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">
          Home
        </Link>
        <Link to="/products" className="btn-outline">
          Shop all
        </Link>
      </div>
    </section>
  );
}
