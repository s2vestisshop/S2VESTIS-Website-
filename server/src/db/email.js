import { supabase, assertNoError } from '../config/supabase.js';

/** Finds the still-queued outbox row a Postgres function already inserted
 * for this order (place_order() does this for order_confirmation) so we can
 * update it in place instead of leaving it stuck at 'queued' forever. */
export async function findQueuedOutboxRow(orderId, template) {
  const { data, error } = await supabase
    .from('email_outbox')
    .select('id')
    .eq('template', template)
    .contains('payload', { orderId })
    .eq('status', 'queued')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(error, 'findQueuedOutboxRow');
  return data?.id ?? null;
}

/** For emails with no pre-inserted row (shipped/delivered — nothing in SQL
 * queues those), so every send still gets a row in the same audit trail. */
export async function insertOutboxRow({ toEmail, template, payload }) {
  const { data, error } = await supabase
    .from('email_outbox')
    .insert({ to_email: toEmail, template, payload })
    .select('id')
    .single();
  assertNoError(error, 'insertOutboxRow');
  return data.id;
}

export async function markOutboxSent(id) {
  const { error } = await supabase
    .from('email_outbox')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id);
  assertNoError(error, 'markOutboxSent');
}

export async function markOutboxFailed(id, errorMessage) {
  const { error } = await supabase
    .from('email_outbox')
    .update({ status: 'failed', error: errorMessage })
    .eq('id', id);
  assertNoError(error, 'markOutboxFailed');
}
