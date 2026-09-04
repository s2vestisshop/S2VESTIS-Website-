import { supabase, assertNoError } from '../config/supabase.js';

async function state(userId) {
  const { data, error } = await supabase.rpc('get_wishlist_state', { p_user_id: userId });
  assertNoError(error, 'wishlistState');
  const products = data?.products ?? [];
  return { _id: userId, products, count: products.length };
}

export async function getWishlist(userId) {
  return state(userId);
}

export async function addToWishlist(userId, productId) {
  const { error } = await supabase
    .from('wishlist_items')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
  assertNoError(error, 'addToWishlist');
  return state(userId);
}

export async function removeFromWishlist(userId, productId) {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  assertNoError(error, 'removeFromWishlist');
  return state(userId);
}
