import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Set for guest carts (uuid stored in a cookie). Null once merged into a user.
    guestId: { type: String, default: null },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

cartSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } }
);
cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
