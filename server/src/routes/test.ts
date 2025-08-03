import express from 'express';
import { chatService } from '../services/chatService.js';

const router = express.Router();

// Test endpoint for multiple queries
router.post('/test-queries', async (req, res) => {
  try {
    const testQueries = [
      "show me sales of laptop",
      "show me ahmed attendance", 
      "show tasks assigned to me",
      "show products today",
      "customer john orders",
      "my tasks pending",
      "stock inventory laptop",
      "sales revenue yesterday",
      "employee shifts this week"
    ];

    const results = [];

    for (const query of testQueries) {
      try {
        console.log(`\n🔍 Testing: "${query}"`);
        
        // Test entity extraction
        const entities = await chatService.extractEntitiesAndInfo(query);
        
        // Test query processing  
        const queryResult = await chatService.processQuery(query, 'Test User');
        
        const result = {
          query,
          entities: entities.map(e => ({
            text: e.text,
            type: e.type,
            table: e.table,
            actualValue: e.actualValue,
            color: e.color,
            confidence: e.confidence
          })),
          response: queryResult.response,
          dataCount: queryResult.data.length,
          sampleData: queryResult.data.slice(0, 2) // First 2 records
        };
        
        results.push(result);
        console.log(`✅ Processed: ${entities.length} entities, ${queryResult.data.length} records`);
        
      } catch (error) {
        console.error(`❌ Error processing "${query}":`, error);
        results.push({
          query,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${testQueries.length} test queries`,
      results
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test entity extraction only
router.post('/test-entities', async (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({
        success: false,
        error: 'queries array is required'
      });
    }

    const results = [];

    for (const query of queries) {
      try {
        const entities = await chatService.extractEntitiesAndInfo(query);
        
        results.push({
          query,
          entities: entities.map(e => ({
            text: e.text,
            type: e.type,
            table: e.table,
            actualValue: e.actualValue,
            color: e.color,
            startIndex: e.startIndex,
            endIndex: e.endIndex,
            confidence: e.confidence
          }))
        });
        
      } catch (error) {
        results.push({
          query,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
