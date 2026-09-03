import Cart from '../models/Cart.js';

const CART_POPULATE = {
  path: 'items.product',
  select: 'name slug price discountPrice discountPercent effectivePrice variants isActive rating gender',
};

/** Returns the cart for a logged-in user, creating an empty one if needed. */
export async function getUserCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

/** Returns the cart for a guest, creating an empty one if needed. */
export async function getGuestCart(guestId) {
  let cart = await Cart.findOne({ guestId });
  if (!cart) cart = await Cart.create({ guestId, items: [] });
  return cart;
}

/** Picks the right cart for the current request (user wins over guest). */
export async function resolveCart(req) {
  if (req.user) return getUserCart(req.user._id);
  return getGuestCart(req.guestId);
}

export function populateCart(cart) {
  return cart.populate(CART_POPULATE);
}

/**
 * Merges a guest cart into the user's cart on login/register, then deletes
 * the guest cart. Same product+color+size lines have their quantities added.
 */
export async function mergeGuestCartIntoUser(guestId, userId) {
  if (!guestId) return;
  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await guestCart.deleteOne();
    return;
  }

  const userCart = await getUserCart(userId);

  for (const gItem of guestCart.items) {
    const match = userCart.items.find(
      (u) =>
        String(u.product) === String(gItem.product) &&
        u.color === gItem.color &&
        u.size === gItem.size
    );
    if (match) {
      match.quantity = Math.min(match.quantity + gItem.quantity, 20);
    } else {
      userCart.items.push({
        product: gItem.product,
        color: gItem.color,
        size: gItem.size,
        quantity: gItem.quantity,
        priceAtAdd: gItem.priceAtAdd,
      });
    }
  }

  await userCart.save();
  await guestCart.deleteOne();
}

/** Serializes a cart with computed subtotal/line totals for API responses. */
export function serializeCart(cart) {
  const items = cart.items.map((item) => {
    const lineTotal = item.priceAtAdd * item.quantity;
    return {
      _id: item._id,
      product: item.product,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      priceAtAdd: item.priceAtAdd,
      lineTotal,
    };
  });
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    _id: cart._id,
    items,
    subtotal,
    count,
    updatedAt: cart.updatedAt,
  };
}
