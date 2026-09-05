import { Router } from 'express';
import { listHeroSlides } from '../controllers/heroController.js';

const router = Router();

router.get('/', listHeroSlides);

export default router;
