import { Link } from 'react-router-dom';
import { ContentLayout } from '@/components/common/ContentLayout';

export function AboutPage() {
  return (
    <ContentLayout
      title="About S2VESTIS"
      intro="Considered apparel — everyday essentials, made to be worn out."
    >
      <p>
        S2VESTIS started with a simple frustration: basics that either cost too much or fell
        apart after a season. We set out to make the opposite — premium fabric, clean cuts and
        honest pricing, in a tight range you can actually build a wardrobe from.
      </p>
      <h2>What we make</h2>
      <p>
        A core line of T-shirts, polos, tees, shirts, linen shirts, sportswear, sweatshirts and
        hoodies for men and women. Every colour has its own photography and its own stock, so what
        you see is what you get.
      </p>
      <h2>How we work</h2>
      <ul>
        <li>Fabric first — mid-to-heavyweight cottons, real linen, brushed fleece.</li>
        <li>Fewer, better styles rather than a constant churn of drops.</li>
        <li>Clear pricing with no invented "original" prices.</li>
      </ul>
      <p>
        Questions? <Link to="/contact">Get in touch</Link>.
      </p>
    </ContentLayout>
  );
}

export function SustainabilityPage() {
  return (
    <ContentLayout
      title="Sustainability"
      intro="Small brand, small range, fewer mistakes to clean up."
    >
      <p>
        We're not going to pretend a clothing company is carbon neutral. What we can do is keep the
        range small, produce to demand rather than forecast, and choose materials and factories we'd
        be comfortable showing you.
      </p>
      <h2>Materials</h2>
      <ul>
        <li>Long-staple and organic cottons where the hand-feel justifies it.</li>
        <li>European flax linen for the linen line.</li>
        <li>Recycled polyester in performance pieces.</li>
      </ul>
      <h2>Packaging</h2>
      <p>
        Orders ship in recycled, recyclable mailers. Hang tags are uncoated card printed with
        vegetable-based inks.
      </p>
      <h2>Longevity</h2>
      <p>
        The most sustainable garment is the one you keep wearing. Our care guidance on each product
        page is written to help pieces last.
      </p>
    </ContentLayout>
  );
}

const STORES = [
  { city: 'Mumbai', address: 'Ground Floor, Kala Ghoda, Fort, Mumbai 400001', hours: 'Mon–Sun · 11:00–20:00' },
  { city: 'Bengaluru', address: '100 Feet Road, Indiranagar, Bengaluru 560038', hours: 'Mon–Sun · 11:00–21:00' },
  { city: 'Delhi', address: 'Meherchand Market, Lodhi Colony, New Delhi 110003', hours: 'Tue–Sun · 11:00–20:00' },
];

export function StoresPage() {
  return (
    <ContentLayout title="Stores" intro="Come see the fabric in person." wide>
      <div className="grid gap-4 sm:grid-cols-2">
        {STORES.map((s) => (
          <div key={s.city} className="rounded-card border border-ink-100 bg-surface p-5">
            <h3 className="text-base font-semibold text-ink-900">{s.city}</h3>
            <p className="mt-1 text-sm text-ink-600">{s.address}</p>
            <p className="mt-2 text-xs text-ink-400">{s.hours}</p>
          </div>
        ))}
      </div>
      <p className="mt-8">
        All stores stock the full core range and offer free returns for online orders. Bring your
        confirmation email or order number.
      </p>
    </ContentLayout>
  );
}

export function ShippingReturnsPage() {
  return (
    <ContentLayout title="Shipping &amp; Returns">
      <h2>Shipping</h2>
      <ul>
        <li>
          <strong>Free standard shipping</strong> on orders over ₹1999. Below that, a flat ₹99.
        </li>
        <li>Standard delivery: 3–6 working days. Metro cities are usually faster.</li>
        <li>Orders placed before 2pm on a working day are dispatched the same day.</li>
      </ul>
      <h2>Returns</h2>
      <ul>
        <li>
          <strong>15 days</strong> from delivery to start a return, for any reason.
        </li>
        <li>Items must be unworn and unwashed with tags attached.</li>
        <li>Refunds are issued to the original payment method within 5–7 working days of us receiving the item.</li>
        <li>Exchanges: return the original and place a new order — it's faster than a swap.</li>
      </ul>
      <h2>Damaged or wrong item</h2>
      <p>
        Email <a href="mailto:help@s2vestis.com">help@s2vestis.com</a> with your order number and a
        photo within 48 hours of delivery and we'll sort it immediately.
      </p>
      <p className="text-xs text-ink-400">
        This is a demonstration store — no real orders are shipped and no payments are taken.
      </p>
    </ContentLayout>
  );
}

export function TrackOrderPage() {
  return (
    <ContentLayout title="Track your order">
      <p>
        Live shipment tracking isn't available in this build. Your placed orders and their contents
        are on your account.
      </p>
      <p>
        <Link to="/account/orders">View your orders →</Link>
      </p>
      <p className="text-xs text-ink-400">
        Real payment and delivery tracking are planned for a future release.
      </p>
    </ContentLayout>
  );
}
