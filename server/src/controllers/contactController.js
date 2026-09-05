import asyncHandler from '../utils/asyncHandler.js';
import { createContactMessage } from '../db/contact.js';

// POST /api/contact
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  await createContactMessage({ name, email, message });
  res.status(201).json({ success: true, message: "Thanks — we'll reply within one working day." });
});
