import express from 'express';
import { homepageController } from './homepage.controller.js';

const router = express.Router();

router.get('/', homepageController.getHomepage);

export default router;
