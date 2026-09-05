import bcrypt from 'bcryptjs';
import { supabase, assertNoError } from '../config/supabase.js';

function toSafeUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function findByEmail(email, { withPasswordHash = false } = {}) {
  const cols = withPasswordHash
    ? 'id, name, email, role, password_hash, created_at'
    : 'id, name, email, role, created_at';
  const { data, error } = await supabase
    .from('users')
    .select(cols)
    .eq('email', email)
    .maybeSingle();
  assertNoError(error, 'findByEmail');
  return data;
}

export async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('id', id)
    .maybeSingle();
  assertNoError(error, 'findById');
  return toSafeUser(data);
}

export async function createUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, password_hash: passwordHash })
    .select('id, name, email, role, created_at')
    .single();
  assertNoError(error, 'createUser');
  return toSafeUser(data);
}

export async function comparePassword(candidate, hash) {
  return bcrypt.compare(candidate, hash);
}

export async function updatePassword(userId, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase.from('users').update({ password_hash: passwordHash }).eq('id', userId);
  assertNoError(error, 'updatePassword');
}

export { toSafeUser };
