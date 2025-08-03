import express from 'express';
import { chatController } from '../controllers/chatController.js';

const router = express.Router();

// Chat endpoints
router.post('/extract', chatController.extractEntities);
router.post('/query', chatController.processQuery);
router.post('/suggestions', chatController.getSuggestions);

export { router as chatRoutes };
