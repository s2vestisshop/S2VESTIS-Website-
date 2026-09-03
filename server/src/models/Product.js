import mongoose from 'mongoose';
import { GENDERS } from '../utils/constants.js';

const sizeStockSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, required: true, trim: true },
    colorHex: { type: String, required: true, trim: true, default: '#000000' },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Each variant needs at least one image',
      },
    },
    sizes: { type: [sizeStockSchema], default: [] },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 5000 },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    gender: { type: String, enum: GENDERS, default: 'unisex', index: true },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    // = discountPrice ?? price. Denormalized so we can sort/filter by real price.
    effectivePrice: { type: Number, default: 0, min: 0, index: true },

    variants: { type: [variantSchema], default: [] },

    rating: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

function recalcPricing(doc) {
  const hasDiscount =
    doc.discountPrice !== null &&
    doc.discountPrice !== undefined &&
    Number(doc.discountPrice) > 0 &&
    Number(doc.discountPrice) < Number(doc.price);

  if (hasDiscount) {
    doc.discountPercent = Math.round(
      ((Number(doc.price) - Number(doc.discountPrice)) / Number(doc.price)) * 100
    );
    doc.effectivePrice = Number(doc.discountPrice);
  } else {
    doc.discountPrice = null;
    doc.discountPercent = 0;
    doc.effectivePrice = Number(doc.price);
  }
}

productSchema.pre('save', function preSave(next) {
  recalcPricing(this);
  next();
});

// Keep pricing consistent on findOneAndUpdate as well.
productSchema.pre('findOneAndUpdate', async function preUpdate(next) {
  const update = this.getUpdate() || {};
  const $set = update.$set || update;
  if ($set.price === undefined && $set.discountPrice === undefined) return next();

  const current = await this.model.findOne(this.getQuery()).lean();
  if (!current) return next();

  const merged = {
    price: $set.price !== undefined ? $set.price : current.price,
    discountPrice:
      $set.discountPrice !== undefined ? $set.discountPrice : current.discountPrice,
  };
  recalcPricing(merged);

  update.$set = {
    ...$set,
    discountPrice: merged.discountPrice,
    discountPercent: merged.discountPercent,
    effectivePrice: merged.effectivePrice,
  };
  this.setUpdate(update);
  return next();
});

productSchema.methods.totalStock = function totalStock() {
  return this.variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s, r) => s + (r.stock || 0), 0),
    0
  );
};

const Product = mongoose.model('Product', productSchema);
export default Product;
