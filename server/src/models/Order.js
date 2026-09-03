import mongoose from 'mongoose';
import { ORDER_STATUS } from '../utils/constants.js';

/**
 * STUB ONLY — no real checkout/payment flow in this build.
 * Kept so the demo /checkout can persist a placeholder record later.
 */
const orderItemSnapshotSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    slug: String,
    image: String,
    color: String,
    size: String,
    quantity: { type: Number, min: 1 },
    price: { type: Number, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSnapshotSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUS, default: 'demo-placed' },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
