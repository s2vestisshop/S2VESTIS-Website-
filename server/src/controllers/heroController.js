import asyncHandler from '../utils/asyncHandler.js';
import { listHeroSlides as listHeroSlidesDb } from '../db/heroSlides.js';

// GET /api/hero-slides  — active slides for the home hero carousel
export const listHeroSlides = asyncHandler(async (_req, res) => {
  const data = await listHeroSlidesDb();
  res.json({ success: true, data });
});
