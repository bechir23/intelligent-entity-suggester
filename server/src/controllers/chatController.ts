import { Request, Response } from 'express';
import { chatService } from '../services/chatService.js';

export const chatController = {
  // Extract entities and info from text
  extractEntities: async (req: Request, res: Response) => {
    try {
      const { message, userId, userName } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const entities = await chatService.extractEntitiesAndInfo(message);
      
      res.json({ entities });
    } catch (error) {
      console.error('Entity extraction error:', error);
      res.status(500).json({ error: 'Failed to extract entities' });
    }
  },

  // Process chat query and generate intelligent response
  processQuery: async (req: Request, res: Response) => {
    try {
      const { message, userId, userName } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await chatService.processQuery(message, userName);
      
      res.json(result);
    } catch (error) {
      console.error('Chat query error:', error);
      res.status(500).json({ 
        error: 'Failed to process query',
        response: 'Sorry, I encountered an error processing your request. Please try again.',
        entities: [],  // Changed from responseEntities to entities for consistency
        data: []
      });
    }
  },

  // Get suggestions for ambiguous entities
  getSuggestions: async (req: Request, res: Response) => {
    try {
      const { query, entityType } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const suggestions = await chatService.getSuggestions(query, entityType);
      
      res.json({ suggestions });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  }
};
