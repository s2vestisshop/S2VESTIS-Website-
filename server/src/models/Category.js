import mongoose from 'mongoose';
import { GENDERS } from '../utils/constants.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    gender: { type: String, enum: GENDERS, default: 'unisex' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
