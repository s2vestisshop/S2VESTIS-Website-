import { Router } from 'express';
import { listAnnouncements } from '../controllers/announcementController.js';

const router = Router();

router.get('/', listAnnouncements);

export default router;
