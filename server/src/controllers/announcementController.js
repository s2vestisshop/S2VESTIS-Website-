import asyncHandler from '../utils/asyncHandler.js';
import { listAnnouncements as listAnnouncementsDb } from '../db/announcements.js';

// GET /api/announcements  — active strip messages for the top bar
export const listAnnouncements = asyncHandler(async (_req, res) => {
  const data = await listAnnouncementsDb();
  res.json({ success: true, data });
});
