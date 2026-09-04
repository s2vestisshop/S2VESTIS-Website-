import { useState } from 'react';
import { Check, Mail, MapPin, MessageSquare } from 'lucide-react';
import { ContentLayout } from '@/components/common/ContentLayout';
import { FormField } from '@/components/auth/FormField';
import { Textarea } from '@/components/admin/fields';
import { isEmail, required } from '@/lib/validate';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!required(form.name)) next.name = 'Enter your name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (form.message.trim().length < 10) next.message = 'A little more detail, please';
    setErrors(next);
    if (Object.keys(next).length) return;
    // UI only — no message is actually sent in this build
    setSent(true);
  };

  return (
    <ContentLayout title="Contact" intro="We usually reply within one working day." wide>
      <div className="grid gap-10 md:grid-cols-[1fr_240px]">
        <div>
          {sent ? (
            <div className="rounded-card border border-sage-200 bg-sage-50 p-6 text-sm text-sage-700">
              <Check className="mb-2 h-5 w-5" />
              Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''}. Your message has been noted —
              this is a demo form, so nothing is actually sent.
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <FormField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
              />
              <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={errors.email}
              />
              <Textarea
                label="Message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                error={errors.message}
              />
              <button type="submit" className="btn-primary">
                Send message
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4 text-sm text-ink-600">
          <p className="flex items-start gap-2.5">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <a href="mailto:help@s2vestis.com">help@s2vestis.com</a>
          </p>
          <p className="flex items-start gap-2.5">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            Live chat, Mon–Fri 10:00–18:00 IST
          </p>
          <p className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            Kala Ghoda, Fort, Mumbai 400001
          </p>
        </aside>
      </div>
    </ContentLayout>
  );
}
