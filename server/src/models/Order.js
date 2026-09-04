import mongoose from 'mongoose';
import { ORDER_STATUS } from '../utils/constants.js';

/**
 * DEMO orders only — no payment capture, no fulfilment / shipment tracking.
 * `/checkout` persists one of these for a logged-in user so the account page
 * can show an order history. Status is always "demo-placed".
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
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [orderItemSnapshotSchema], default: [] },
    itemCount: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUS, default: 'demo-placed' },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
