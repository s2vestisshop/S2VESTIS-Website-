import asyncHandler from '../utils/asyncHandler.js';
import { listCategories as listCategoriesDb } from '../db/categories.js';

// GET /api/categories
export const listCategories = asyncHandler(async (req, res) => {
  const includeCounts = req.query.withCounts === 'true';
  const data = await listCategoriesDb(includeCounts);
  res.json({ success: true, data });
});
