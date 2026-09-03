import asyncHandler from '../utils/asyncHandler.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

// GET /api/categories
export const listCategories = asyncHandler(async (req, res) => {
  const includeCounts = req.query.withCounts === 'true';
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

  if (!includeCounts) {
    return res.json({ success: true, data: categories });
  }

  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  const data = categories.map((c) => ({
    ...c,
    productCount: countMap[String(c._id)] || 0,
  }));
  return res.json({ success: true, data });
});
