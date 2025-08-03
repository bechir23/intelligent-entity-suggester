/**
 * Comprehensive Entity Detection System Test
 * Tests all components: Backend API, Frontend Integration, Entity Rendering
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5175';

class EntitySystemTester {
  constructor() {
    this.results = {
      backend: {},
      frontend: {},
      integration: {},
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'test' ? '🧪' : '📝';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.results.errors.push(message);
    }
  }

  async testBackendAPI() {
    this.log('Testing Backend API Endpoints', 'test');

    try {
      // Test 1: Health Check
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      this.results.backend.health = healthResponse.status === 200;
      this.log(`Backend health check: ${this.results.backend.health ? 'PASSED' : 'FAILED'}`, 
               this.results.backend.health ? 'success' : 'error');

      // Test 2: Entity Extraction API
      const testQueries = [
        'sales of ahmed',
        'customers',
        'laptop',
        'sales of john'
      ];

      this.results.backend.entityExtraction = {};

      for (const query of testQueries) {
        try {
          const response = await axios.post(`${BACKEND_URL}/api/chat/extract`, {
            message: query
          });

          const isValid = response.status === 200 && 
                         response.data && 
                         Array.isArray(response.data.entities);

          this.results.backend.entityExtraction[query] = {
            success: isValid,
            entityCount: isValid ? response.data.entities.length : 0,
            entities: isValid ? response.data.entities : [],
            response: response.data
          };

          this.log(`Entity extraction for "${query}": ${isValid ? 'PASSED' : 'FAILED'} (${response.data.entities?.length || 0} entities)`, 
                   isValid ? 'success' : 'error');

          // Validate entity structure
          if (isValid && response.data.entities.length > 0) {
            const entity = response.data.entities[0];
            const hasRequiredFields = entity.text && entity.type && entity.color && 
                                    typeof entity.startIndex === 'number' && 
                                    typeof entity.endIndex === 'number';
            
            if (!hasRequiredFields) {
              this.log(`Entity structure validation FAILED for "${query}" - missing required fields`, 'error');
            } else {
              this.log(`Entity structure validation PASSED for "${query}"`, 'success');
            }
          }

        } catch (error) {
          this.results.backend.entityExtraction[query] = {
            success: false,
            error: error.message
          };
          this.log(`Entity extraction for "${query}": FAILED - ${error.message}`, 'error');
        }
      }

    } catch (error) {
      this.log(`Backend API test failed: ${error.message}`, 'error');
      this.results.backend.health = false;
    }
  }

  async testFrontendIntegration() {
    this.log('Testing Frontend Integration', 'test');

    try {
      // Check if frontend files exist and are correctly structured
      const frontendPath = path.join(__dirname, 'src', 'components', 'ProfessionalChatInterface.tsx');
      
      if (!fs.existsSync(frontendPath)) {
        this.log('Frontend component file not found', 'error');
        return;
      }

      const frontendContent = fs.readFileSync(frontendPath, 'utf8');

      // Test 1: Check for essential functions
      const requiredFunctions = [
        'extractEntitiesFromInput',
        'handleEntityHover',
        'currentEntities',
        'setCurrentEntities'
      ];

      this.results.frontend.functions = {};
      
      for (const func of requiredFunctions) {
        const exists = frontendContent.includes(func);
        this.results.frontend.functions[func] = exists;
        this.log(`Function "${func}": ${exists ? 'FOUND' : 'MISSING'}`, exists ? 'success' : 'error');
      }

      // Test 2: Check for correct API endpoint
      const hasCorrectEndpoint = frontendContent.includes('/api/chat/extract');
      this.results.frontend.apiEndpoint = hasCorrectEndpoint;
      this.log(`Correct API endpoint: ${hasCorrectEndpoint ? 'FOUND' : 'MISSING'}`, hasCorrectEndpoint ? 'success' : 'error');

      // Test 3: Check for useEffect with proper dependencies
      const hasUseEffect = frontendContent.includes('useEffect') && 
                          frontendContent.includes('[query, extractEntitiesFromInput]');
      this.results.frontend.useEffect = hasUseEffect;
      this.log(`useEffect with query dependency: ${hasUseEffect ? 'FOUND' : 'MISSING'}`, hasUseEffect ? 'success' : 'error');

      // Test 4: Check for entity rendering logic
      const hasEntityRendering = frontendContent.includes('entity-overlay') && frontendContent.includes('currentEntities.map');
      this.results.frontend.entityRendering = hasEntityRendering;
      this.log(`Entity rendering logic: ${hasEntityRendering ? 'FOUND' : 'MISSING'}`, hasEntityRendering ? 'success' : 'error');

      // Test 5: Check CSS classes
      const cssPath = path.join(__dirname, 'src', 'components', 'ProfessionalChatInterface.css');
      if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const hasEntityCSS = cssContent.includes('.entity-overlay') && cssContent.includes('.entity-overlay-item');
        this.results.frontend.css = hasEntityCSS;
        this.log(`Entity CSS classes: ${hasEntityCSS ? 'FOUND' : 'MISSING'}`, hasEntityCSS ? 'success' : 'error');
      } else {
        this.results.frontend.css = false;
        this.log('CSS file not found', 'error');
      }

    } catch (error) {
      this.log(`Frontend integration test failed: ${error.message}`, 'error');
    }
  }

  async testCORSConfiguration() {
    this.log('Testing CORS Configuration', 'test');

    try {
      // Test CORS preflight
      const response = await axios.options(`${BACKEND_URL}/api/chat/extract`);
      const corsHeaders = response.headers['access-control-allow-origin'];
      
      this.results.backend.cors = {
        working: !!corsHeaders,
        allowedOrigins: corsHeaders
      };

      this.log(`CORS configuration: ${corsHeaders ? 'WORKING' : 'MISSING'}`, corsHeaders ? 'success' : 'error');

    } catch (error) {
      this.log(`CORS test failed: ${error.message}`, 'error');
      this.results.backend.cors = { working: false, error: error.message };
    }
  }

  async testEntityPositioning() {
    this.log('Testing Entity Positioning Logic', 'test');

    const testCases = [
      { query: 'sales of ahmed', expectedEntities: 2, expectedPositions: [[0, 5], [9, 14]] },
      { query: 'customers', expectedEntities: 1, expectedPositions: [[0, 9]] },
      { query: 'laptop', expectedEntities: 1, expectedPositions: [[0, 6]] }
    ];

    this.results.backend.positioning = {};

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/chat/extract`, {
          message: testCase.query
        });

        if (response.data && response.data.entities) {
          const entities = response.data.entities;
          const positioningCorrect = entities.length === testCase.expectedEntities &&
                                   entities.every((entity, i) => {
                                     const expected = testCase.expectedPositions[i];
                                     return expected && entity.startIndex === expected[0] && entity.endIndex === expected[1];
                                   });

          this.results.backend.positioning[testCase.query] = {
            correct: positioningCorrect,
            actual: entities.map(e => [e.startIndex, e.endIndex]),
            expected: testCase.expectedPositions
          };

          this.log(`Entity positioning for "${testCase.query}": ${positioningCorrect ? 'CORRECT' : 'INCORRECT'}`, 
                   positioningCorrect ? 'success' : 'error');
        }

      } catch (error) {
        this.log(`Entity positioning test failed for "${testCase.query}": ${error.message}`, 'error');
      }
    }
  }

  async testEntitySuggestions() {
    this.log('Testing Entity Suggestions', 'test');

    try {
      // Test queries that should have suggestions
      const response = await axios.post(`${BACKEND_URL}/api/chat/extract`, {
        message: 'sales of ahmed'
      });

      if (response.data && response.data.entities) {
        const entitiesWithSuggestions = response.data.entities.filter(e => e.suggestions && e.suggestions.length > 0);
        
        this.results.backend.suggestions = {
          working: entitiesWithSuggestions.length > 0,
          count: entitiesWithSuggestions.length,
          entities: entitiesWithSuggestions
        };

        this.log(`Entity suggestions: ${entitiesWithSuggestions.length > 0 ? 'WORKING' : 'NOT WORKING'} (${entitiesWithSuggestions.length} entities with suggestions)`, 
                 entitiesWithSuggestions.length > 0 ? 'success' : 'error');
      }

    } catch (error) {
      this.log(`Entity suggestions test failed: ${error.message}`, 'error');
    }
  }

  generateFixReport() {
    this.log('Generating Fix Report', 'test');

    const fixes = [];

    // Backend fixes
    if (!this.results.backend.health) {
      fixes.push({
        component: 'Backend',
        issue: 'Backend server not responding',
        priority: 'HIGH',
        fix: 'Start backend server: npm run dev:backend'
      });
    }

    // API endpoint fixes
    if (this.results.backend.entityExtraction) {
      const failedQueries = Object.entries(this.results.backend.entityExtraction)
        .filter(([query, result]) => !result.success);
      
      if (failedQueries.length > 0) {
        fixes.push({
          component: 'Backend API',
          issue: `Entity extraction failing for queries: ${failedQueries.map(([q]) => q).join(', ')}`,
          priority: 'HIGH',
          fix: 'Check backend logs, verify database connection, ensure entity extraction service is working'
        });
      }
    }

    // Frontend fixes
    if (this.results.frontend.functions) {
      const missingFunctions = Object.entries(this.results.frontend.functions)
        .filter(([func, exists]) => !exists)
        .map(([func]) => func);

      if (missingFunctions.length > 0) {
        fixes.push({
          component: 'Frontend',
          issue: `Missing essential functions: ${missingFunctions.join(', ')}`,
          priority: 'HIGH',
          fix: 'Add missing functions to ProfessionalChatInterface.tsx'
        });
      }
    }

    if (!this.results.frontend.apiEndpoint) {
      fixes.push({
        component: 'Frontend',
        issue: 'Missing or incorrect API endpoint',
        priority: 'HIGH',
        fix: 'Update API endpoint to /api/chat/extract in frontend'
      });
    }

    if (!this.results.frontend.useEffect) {
      fixes.push({
        component: 'Frontend',
        issue: 'Missing useEffect for query changes',
        priority: 'HIGH',
        fix: 'Add useEffect with [query] dependency to trigger entity extraction'
      });
    }

    if (!this.results.frontend.entityRendering) {
      fixes.push({
        component: 'Frontend',
        issue: 'Missing entity rendering logic',
        priority: 'HIGH',
        fix: 'Add entity overlay rendering with currentEntities.map'
      });
    }

    if (!this.results.frontend.css) {
      fixes.push({
        component: 'Frontend CSS',
        issue: 'Missing entity CSS classes',
        priority: 'MEDIUM',
        fix: 'Add .entity-overlay and .entity-overlay-item CSS classes'
      });
    }

    // CORS fixes
    if (this.results.backend.cors && !this.results.backend.cors.working) {
      fixes.push({
        component: 'Backend CORS',
        issue: 'CORS not configured properly',
        priority: 'HIGH',
        fix: 'Configure CORS to allow frontend origin'
      });
    }

    // Positioning fixes
    if (this.results.backend.positioning) {
      const incorrectPositioning = Object.entries(this.results.backend.positioning)
        .filter(([query, result]) => !result.correct);

      if (incorrectPositioning.length > 0) {
        fixes.push({
          component: 'Backend Entity Positioning',
          issue: `Incorrect entity positions for: ${incorrectPositioning.map(([q]) => q).join(', ')}`,
          priority: 'MEDIUM',
          fix: 'Fix entity startIndex and endIndex calculation in backend'
        });
      }
    }

    // Suggestions fixes
    if (this.results.backend.suggestions && !this.results.backend.suggestions.working) {
      fixes.push({
        component: 'Backend Entity Suggestions',
        issue: 'Entity suggestions not working',
        priority: 'MEDIUM',
        fix: 'Implement entity suggestions logic in backend'
      });
    }

    return fixes;
  }

  async runAllTests() {
    this.log('Starting Comprehensive Entity System Test', 'test');
    
    await this.testBackendAPI();
    await this.testCORSConfiguration();
    await this.testEntityPositioning();
    await this.testEntitySuggestions();
    await this.testFrontendIntegration();

    const fixes = this.generateFixReport();

    // Output results
    console.log('\n' + '='.repeat(80));
    console.log('📊 ENTITY SYSTEM TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log('\n🔧 REQUIRED FIXES:');
    if (fixes.length === 0) {
      console.log('✅ No fixes required - system is working correctly!');
    } else {
      fixes.forEach((fix, index) => {
        console.log(`\n${index + 1}. [${fix.priority}] ${fix.component}`);
        console.log(`   Issue: ${fix.issue}`);
        console.log(`   Fix: ${fix.fix}`);
      });
    }

    console.log('\n📋 DETAILED RESULTS:');
    console.log(JSON.stringify(this.results, null, 2));

    return {
      passed: fixes.length === 0,
      fixes,
      results: this.results
    };
  }
}

// Run tests
async function main() {
  const tester = new EntitySystemTester();
  const results = await tester.runAllTests();
  
  process.exit(results.passed ? 0 : 1);
}

main().catch(console.error);
