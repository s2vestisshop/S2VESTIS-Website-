import { supabase, assertNoError } from '../config/supabase.js';

export async function createContactMessage({ name, email, message }) {
  const { error } = await supabase.from('contact_messages').insert({ name, email, message });
  assertNoError(error, 'createContactMessage');
}
