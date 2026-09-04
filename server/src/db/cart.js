import { supabase, assertNoError } from '../config/supabase.js';

/** Returns { id } for the request's cart (user wins over guest), creating one if needed. */
export async function resolveCartId(req) {
  if (req.user) return getOrCreateUserCartId(req.user._id);
  return getOrCreateGuestCartId(req.guestId);
}

export async function getOrCreateUserCartId(userId) {
  const { data, error } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  assertNoError(error, 'getOrCreateUserCartId:find');
  if (data) return data.id;

  const { data: created, error: insErr } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single();
  assertNoError(insErr, 'getOrCreateUserCartId:create');
  return created.id;
}

export async function getOrCreateGuestCartId(guestToken) {
  const { data, error } = await supabase
    .from('carts')
    .select('id')
    .eq('guest_token', guestToken)
    .maybeSingle();
  assertNoError(error, 'getOrCreateGuestCartId:find');
  if (data) return data.id;

  const { data: created, error: insErr } = await supabase
    .from('carts')
    .insert({ guest_token: guestToken })
    .select('id')
    .single();
  assertNoError(insErr, 'getOrCreateGuestCartId:create');
  return created.id;
}

/** Fully-shaped cart for the API response (matches the frontend Cart type). */
export async function getCartState(req) {
  const { data, error } = await supabase.rpc('get_cart_state', {
    p_user_id: req.user ? req.user._id : null,
    p_guest_token: req.user ? null : req.guestId,
  });
  assertNoError(error, 'getCartState');
  return data;
}

export async function findCartItem(cartId, variantSizeId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('variant_size_id', variantSizeId)
    .maybeSingle();
  assertNoError(error, 'findCartItem');
  return data;
}

export async function upsertCartItem({ cartId, variantSizeId, quantity, priceAtAdd }) {
  const existing = await findCartItem(cartId, variantSizeId);
  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, price_at_add: priceAtAdd })
      .eq('id', existing.id);
    assertNoError(error, 'upsertCartItem:update');
    return existing.id;
  }
  const { data, error } = await supabase
    .from('cart_items')
    .insert({ cart_id: cartId, variant_size_id: variantSizeId, quantity, price_at_add: priceAtAdd })
    .select('id')
    .single();
  assertNoError(error, 'upsertCartItem:insert');
  return data.id;
}

/** Looks a cart item up together with its live product/variant/size for validation. */
export async function getCartItemWithStock(cartId, itemId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      'id, quantity, cart_id, variant_size_id, variant_sizes(id, size, stock, product_variants(id, color, product_id, products(id, is_active)))'
    )
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .maybeSingle();
  assertNoError(error, 'getCartItemWithStock');
  if (!data) return null;

  const vs = data.variant_sizes;
  const variant = vs?.product_variants;
  const product = variant?.products;
  return {
    itemId: data.id,
    quantity: data.quantity,
    stock: vs?.stock ?? 0,
    productActive: !!product?.is_active,
  };
}

export async function updateCartItemQuantity(itemId, quantity) {
  const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
  assertNoError(error, 'updateCartItemQuantity');
}

export async function deleteCartItem(cartId, itemId) {
  const { data, error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .select('id');
  assertNoError(error, 'deleteCartItem');
  return (data?.length ?? 0) > 0;
}

export async function clearCartItems(cartId) {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  assertNoError(error, 'clearCartItems');
}

/** Called on login/register: folds the guest cart into the user's cart. */
export async function mergeGuestCart(guestToken, userId) {
  if (!guestToken) return;
  const { error } = await supabase.rpc('merge_guest_cart', {
    p_guest_token: guestToken,
    p_user_id: userId,
  });
  assertNoError(error, 'mergeGuestCart');
}
