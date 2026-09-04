import { Link } from 'react-router-dom';
import { ContentLayout } from '@/components/common/ContentLayout';
import { DetailsAccordion } from '@/components/product/DetailsAccordion';

const FAQS = [
  {
    title: 'How do the sizes run?',
    content:
      'True to size for a modern fit. If you prefer a relaxed look, size up — full measurements are on the size guide linked from every product page.',
  },
  {
    title: 'When will my order arrive?',
    content:
      'Standard delivery is 3–6 working days. Orders placed before 2pm on a working day are dispatched the same day. (This is a demo store, so nothing actually ships.)',
  },
  {
    title: 'What is the return policy?',
    content:
      '15 days from delivery, for any reason, as long as items are unworn and unwashed with tags attached. Refunds go back to the original payment method within 5–7 working days.',
  },
  {
    title: 'Do you restock sold-out colours and sizes?',
    content:
      'Core styles are restocked regularly. Sold-out sizes on a product page show as disabled; check back or contact us and we can tell you the next run.',
  },
  {
    title: 'How should I wash my S2VESTIS pieces?',
    content:
      'Machine wash cold, inside out, and tumble dry low or hang to dry. Skip the fabric softener on performance pieces. Specific guidance is in the "Details & care" section on each product.',
  },
  {
    title: 'Can I change or cancel an order?',
    content:
      'In a real store, yes — within a short window before dispatch. In this demo, placing an order just records it on your account and empties your cart.',
  },
];

export function FaqPage() {
  return (
    <ContentLayout title="FAQ" intro="The questions we get asked most.">
      <DetailsAccordion sections={FAQS} defaultOpen={null} />
      <p className="mt-8">
        Didn't find it? <Link to="/contact">Contact us</Link>.
      </p>
    </ContentLayout>
  );
}
