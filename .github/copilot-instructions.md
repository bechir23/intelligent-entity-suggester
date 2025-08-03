<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Intelligent Entity Suggester System

This project implements a comprehensive intelligent entity suggestion system with the following components:

## Architecture
- **Frontend**: React + TypeScript + Vite with TipTap rich text editor
- **Backend**: Node.js + Express + Socket.IO for real-time suggestions
- **Database**: Supabase with PostgreSQL full-text search capabilities
- **Testing**: Cypress for UI, Vitest for API

## Key Features
- Rich text editor with entity suggestions and metadata injection
- Real-time WebSocket-based suggestions (< 150ms response time)
- Full-text search with trigram indexes and ranking formulas
- Date/time NLP parsing for relative date tokens
- Pronoun resolution ("me" → logged-in user)
- Comprehensive audit trail for metadata persistence
- Debounced and rate-limited API endpoints

## Database Schema
Tables include: customers, products, sales, stock, tasks, shifts, attendance, date_dimension, users, and audit_trail

## Development Guidelines
- Use TypeScript strict mode
- Implement proper error handling
- Follow REST API conventions
- Ensure real-time performance requirements
- Maintain comprehensive test coverage
- Use environment variables for configuration
