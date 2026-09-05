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
        Once your order ships, its tracking link, courier and delivery status all appear on the
        order's page in your account.
      </p>
      <p>
        <Link to="/account/orders">View your orders →</Link>
      </p>
    </ContentLayout>
  );
}

const LAST_UPDATED = 'September 2026';

export function PrivacyPolicyPage() {
  return (
    <ContentLayout title="Privacy Policy" intro={`Last updated: ${LAST_UPDATED}`} wide>
      <p>
        This policy explains what personal data S2VESTIS collects when you use this site, why, and
        who we share it with.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account details you provide: name, email, password (stored hashed, never in plain text).</li>
        <li>Order details: items purchased, delivery address, phone number, order history.</li>
        <li>Payment information: we never see or store your card, UPI, or bank details — payments are processed entirely by Razorpay, our payment processor.</li>
        <li>Basic usage data (pages viewed, device/browser type) to keep the site working and secure.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To create your account, process orders, and arrange delivery.</li>
        <li>To send order confirmations, shipping updates, and — only if you ask — password reset emails.</li>
        <li>To respond to support requests you send us.</li>
      </ul>
      <h2>Who we share it with</h2>
      <p>We share only what's needed to fulfil your order, with:</p>
      <ul>
        <li>
          <strong>Razorpay</strong> — to process payment. Razorpay's own privacy policy governs how
          they handle your payment details.
        </li>
        <li>
          <strong>Our courier partner (via Shiprocket)</strong> — your name, phone number, and
          delivery address, solely to deliver your order.
        </li>
      </ul>
      <p>We do not sell your personal information to anyone.</p>
      <h2>Cookies</h2>
      <p>
        We use a small number of essential cookies to keep you signed in and to remember your cart.
        We don't use third-party advertising cookies.
      </p>
      <h2>Your rights</h2>
      <p>
        You can review or update your account details at any time from your account page, or
        contact us to request deletion of your data, subject to what we're required to keep for
        legal, accounting, or fraud-prevention reasons (such as order records).
      </p>
      <h2>Grievance officer</h2>
      <p>
        For any privacy concerns or complaints, contact us at{' '}
        <a href="mailto:help@s2vestis.com">help@s2vestis.com</a>. We aim to acknowledge complaints
        within 48 hours.
      </p>
      <p className="text-xs text-ink-400">
        This policy is a plain-language starting point and hasn't been reviewed by a lawyer — have
        it checked before relying on it for a live store handling real customer data.
      </p>
    </ContentLayout>
  );
}

export function TermsPage() {
  return (
    <ContentLayout title="Terms &amp; Conditions" intro={`Last updated: ${LAST_UPDATED}`} wide>
      <p>
        These terms govern your use of the S2VESTIS website and any order you place through it. By
        placing an order, you agree to them.
      </p>
      <h2>Orders &amp; pricing</h2>
      <ul>
        <li>All prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
        <li>We reserve the right to refuse or cancel an order — for example if an item is out of stock or its price was listed incorrectly. If we cancel a paid order, you'll receive a full refund.</li>
        <li>An order is confirmed only once payment is successfully captured by Razorpay.</li>
      </ul>
      <h2>Payment</h2>
      <p>
        Payments are processed securely by Razorpay. We do not store your card, UPI, or bank
        details on our servers.
      </p>
      <h2>Shipping, delivery &amp; returns</h2>
      <p>
        See our <Link to="/shipping">Shipping &amp; Returns</Link> page for delivery timelines and
        our return policy.
      </p>
      <h2>Account</h2>
      <p>
        You're responsible for keeping your account password confidential and for all activity
        under your account.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, S2VESTIS is not liable for indirect or consequential
        losses arising from your use of this site or your order, beyond the value of that order.
      </p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and any dispute is subject to the exclusive
        jurisdiction of the courts of Mumbai, Maharashtra.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href="mailto:help@s2vestis.com">help@s2vestis.com</a>.
      </p>
      <p className="text-xs text-ink-400">
        These terms are a plain-language starting point and haven't been reviewed by a lawyer —
        have them checked before relying on them for a live store handling real payments.
      </p>
    </ContentLayout>
  );
}
