import { useState } from 'react';
import { Check } from 'lucide-react';

/** UI only — no email service wired up in this build. */
export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail('');
    window.setTimeout(() => setDone(false), 4000);
  };

  return (
    <section className="bg-ink-900 text-canvas">
      <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
        <div>
          <h2 className="text-2xl font-bold text-canvas sm:text-3xl">
            10% off your first order
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-200">
            Join the list for early access to new arrivals, restocks and members-only pricing.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full max-w-md gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-12 flex-1 rounded-card border border-ink-600 bg-ink-800 px-4 text-sm text-canvas placeholder:text-ink-400 focus:border-clay-400 focus:outline-none"
          />
          <button type="submit" className="btn-accent h-12 shrink-0 px-6">
            {done ? (
              <>
                <Check className="h-4 w-4" /> Done
              </>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>

        {done && <p className="text-xs text-sage-200">Thanks — check your inbox for the code.</p>}
        <p className="text-[11px] text-ink-400">
          By subscribing you agree to receive marketing emails. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
