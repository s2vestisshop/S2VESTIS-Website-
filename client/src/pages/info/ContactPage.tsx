import { useState } from 'react';
import { AlertCircle, Check, Mail, MapPin, MessageSquare } from 'lucide-react';
import { ContentLayout } from '@/components/common/ContentLayout';
import { FormField } from '@/components/auth/FormField';
import { Textarea } from '@/components/admin/fields';
import { contactApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { isEmail, required } from '@/lib/validate';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const next: typeof errors = {};
    if (!required(form.name)) next.name = 'Enter your name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (form.message.trim().length < 10) next.message = 'A little more detail, please';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await contactApi.send(form);
      setSent(true);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentLayout title="Contact" intro="We usually reply within one working day." wide>
      <div className="grid gap-10 md:grid-cols-[1fr_240px]">
        <div>
          {sent ? (
            <div className="rounded-card border border-sage-200 bg-sage-50 p-6 text-sm text-sage-700">
              <Check className="mb-2 h-5 w-5" />
              Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''} — your message has been sent.
              We usually reply within one working day.
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-card border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
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
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Sending…' : 'Send message'}
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
