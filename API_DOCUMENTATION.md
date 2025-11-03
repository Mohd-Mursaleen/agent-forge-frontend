# Dynamic Task Generation Backend API Documentation

## Overview

This backend provides a complete system for creating AI agents that can dynamically generate their own tools and capabilities. The system enables users to create domain-specific AI assistants (like medical shop assistants, customer service bots, etc.) without manual coding.

## Base URL
```
http://localhost:8000
```

## Authentication

### Clerk Integration
The API uses Clerk for authentication. Include the Clerk JWT token in the Authorization header:

```http
Authorization: Bearer <clerk_jwt_token>
```

### Test Token (Development Only)
For testing purposes, you can use:
```http
Authorization: Bearer test_token_123456789
```

### Protected Routes
All API endpoints except `/health` require authentication. WebSocket connections for chat are also protected by the auth middleware.

### User Context
After authentication, user information is available in the request context:
```json
{
  "org_id": "user_id_from_clerk",
  "email": "user@example.com", 
  "name": "User Name",
  "roles": [],
  "permissions": [],
  "tier": "free"  // Used for rate limiting
}
```

## Rate Limiting

### Overview
The API implements rate limiting to ensure fair usage and system stability. Rate limits are applied per user and vary based on subscription tier and endpoint type.

### Rate Limit Tiers
- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1,000 requests per hour  
- **Enterprise Tier**: 10,000 requests per hour

### Endpoint-Specific Limits (per minute)
- **Chat endpoints**: 30 requests
- **File uploads/CSV import**: 5 requests
- **Search operations**: 100 requests
- **Create operations**: 20 requests
- **Default endpoints**: 60 requests

### Rate Limit Headers
All responses include rate limiting information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
Retry-After: 60  # Only present when rate limited
```

### Rate Limit Exceeded Response
When rate limit is exceeded, you'll receive a 429 status code:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Limit: 60 per 60 seconds",
  "retry_after": 60,
  "limit": 60,
  "remaining": 0
}
```

### Rate Limiting Implementation
- Uses Redis with sliding window algorithm
- Graceful degradation if Redis is unavailable
- Per-user and per-endpoint tracking
- Automatic tier-based limit adjustment

---

## API Endpoints

## 1. Health Check

### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "healthy"
}
```

---

## 2. Agents Management

### POST /api/agents/
Create a new AI agent.

**Request Body:**
```json
{
  "name": "Medical Shop Assistant",
  "description": "Helps customers with medicine inquiries and orders",
  "system_prompt": "You are a helpful pharmacy assistant. Use your tools to search for medicine information and help customers."
}
```

**Response:**
```json
{
  "id": "agent-uuid",
  "name": "Medical Shop Assistant",
  "description": "Helps customers with medicine inquiries and orders",
  "system_prompt": "You are a helpful pharmacy assistant...",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

### GET /api/agents/
Get all agents for the authenticated user.

**Response:**
```json
[
  {
    "id": "agent-uuid",
    "name": "Medical Shop Assistant",
    "description": "Helps customers with medicine inquiries and orders",
    "system_prompt": "You are a helpful pharmacy assistant...",
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
]
```

### GET /api/agents/{agent_id}
Get a specific agent by ID.

### PUT /api/agents/{agent_id}
Update an agent.

**Request Body:**
```json
{
  "name": "Updated Agent Name",
  "description": "Updated description"
}
```

### DELETE /api/agents/{agent_id}
Delete an agent.

---

## 3. Vector Tables Management

Vector tables store your domain-specific data with semantic search capabilities.

### POST /api/vector-tables/
Create a new vector table.

**Request Body:**
```json
{
  "agent_id": "agent-uuid",
  "name": "medicines",
  "display_name": "Medicine Inventory",
  "description": "Database of available medicines with prices and information",
  "columns": [
    {
      "name": "medicine_name",
      "type": "string",
      "description": "Name of the medicine"
    },
    {
      "name": "price",
      "type": "number", 
      "description": "Price per unit"
    },
    {
      "name": "availability",
      "type": "string",
      "description": "Stock availability status"
    },
    {
      "name": "description",
      "type": "string",
      "description": "Medicine description and usage"
    },
    {
      "name": "category",
      "type": "string",
      "description": "Medicine category"
    }
  ]
}
```

**Response:**
```json
{
  "id": "table-uuid",
  "agent_id": "agent-uuid",
  "name": "medicines",
  "display_name": "Medicine Inventory",
  "description": "Database of available medicines...",
  "columns": [...],
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

### GET /api/vector-tables/agent/{agent_id}
Get all tables for a specific agent.

### GET /api/vector-tables/{table_id}
Get a specific table by ID.

### DELETE /api/vector-tables/{table_id}
Delete a vector table.

### POST /api/vector-tables/import-csv/{agent_id}
Import a CSV file to create a vector table with automatic column detection.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV file to import
- `table_name`: Name for the new table
- `table_display_name` (optional): Display name for the table
- `table_description` (optional): Description of the table

**Response:**
```json
{
  "success": true,
  "message": "Created table 'medicines' with 25 records",
  "table_id": "table-uuid",
  "table_name": "medicines",
  "total_records": 25,
  "successful_records": 25,
  "failed_records": 0,
  "columns_detected": 6
}
```

**Features:**
- Automatic column type detection (string, number, boolean)
- Batch processing for large files
- Automatic vector embedding generation
- Error handling for malformed data
- Progress tracking for import status

---

## 4. Records Management

### POST /api/vector-tables/{table_id}/records
Add a single record to a vector table.

**Request Body:**
```json
{
  "data": {
    "medicine_name": "Paracetamol 500mg",
    "price": 5.99,
    "availability": "In Stock",
    "description": "Pain reliever and fever reducer",
    "category": "Pain Relief"
  }
}
```

**Response:**
```json
{
  "id": "record-uuid",
  "table_id": "table-uuid",
  "data": {
    "medicine_name": "Paracetamol 500mg",
    "price": 5.99,
    "availability": "In Stock",
    "description": "Pain reliever and fever reducer",
    "category": "Pain Relief"
  },
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

### POST /api/vector-tables/{table_id}/records/batch
Add multiple records at once.

**Request Body:**
```json
[
  {
    "data": {
      "medicine_name": "Paracetamol 500mg",
      "price": 5.99,
      "availability": "In Stock",
      "description": "Pain reliever and fever reducer",
      "category": "Pain Relief"
    }
  },
  {
    "data": {
      "medicine_name": "Ibuprofen 400mg",
      "price": 8.50,
      "availability": "In Stock", 
      "description": "Anti-inflammatory pain reliever",
      "category": "Pain Relief"
    }
  }
]
```

### GET /api/vector-tables/{table_id}/records
Get all records from a table.

**Query Parameters:**
- `limit` (optional): Maximum number of records to return (default: 100)

### POST /api/vector-tables/{table_id}/search
Search records using semantic similarity.

**Request Body:**
```json
{
  "query": "pain relief medicine under 10 dollars",
  "limit": 5,
  "similarity_threshold": 0.4
}
```

**Response:**
```json
[
  {
    "id": "record-uuid",
    "data": {
      "medicine_name": "Paracetamol 500mg",
      "price": 5.99,
      "availability": "In Stock",
      "description": "Pain reliever and fever reducer",
      "category": "Pain Relief"
    },
    "similarity": 0.85
  }
]
```

---

## 5. Tasks Management (Dynamic Tool Generation)

Tasks are natural language descriptions that get automatically converted into executable AI tools.

### POST /api/tasks/
Create a new task with AI-generated tool definition.

**Request Body:**
```json
{
  "agent_id": "agent-uuid",
  "task_name": "search_medicines",
  "task_description": "Help customers search for medicines by name, category, or symptoms. Find medicines based on price range and availability.",
  "table_id": "table-uuid"
}
```

**Response:**
```json
{
  "id": "task-uuid",
  "agent_id": "agent-uuid", 
  "task_name": "search_medicines",
  "task_description": "Help customers search for medicines...",
  "tools": {
    "task_name": "search_medicines",
    "operation_type": "read",
    "description": "Searches the medicine inventory for medicines based on name, category, symptoms, pricing range, and availability.",
    "selected_table": "Medicine Inventory",
    "table_id": "table-uuid",
    "parameters": [
      {
        "name": "medicine_name",
        "type": "string",
        "description": "The name of the medicine to search for."
      },
      {
        "name": "category", 
        "type": "string",
        "description": "Category of medicine, such as pain relief or antibiotic."
      }
    ]
  },
  "table_reference": {
    "table_name": "Medicine Inventory",
    "table_id": "table-uuid"
  },
  "is_active": true,
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

### GET /api/tasks/agent/{agent_id}
Get all tasks for a specific agent.

### GET /api/tasks/{task_id}
Get a specific task by ID.

### PUT /api/tasks/{task_id}
Update a task.

### DELETE /api/tasks/{task_id}
Delete a task.

---

## 6. Chat Interface

### POST /api/chat/
Chat with an agent via HTTP.

**Request Body:**
```json
{
  "agent_id": "agent-uuid",
  "message": "I need something for headache under $10",
  "conversation_history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant", 
      "content": "Hi! How can I help you today?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "I found some great options for headache relief under $10. Here are some recommendations: Paracetamol 500mg for $5.99 - it's a safe and effective pain reliever...",
  "tool_calls": [
    {
      "tool": "search_medicines",
      "input": {
        "query": "headache pain relief",
        "price_max": 10
      },
      "output": "[{\"data\": {...}, \"similarity\": 0.85}]"
    }
  ]
}
```

### WebSocket: /api/chat/ws/{agent_id}/{client_id}
Real-time chat with an agent.

**Connection URL:**
```
ws://localhost:8000/api/chat/ws/{agent_id}/{client_id}
```

**Message Format:**
```json
{
  "message": "I need pain relief medicine"
}
```

**Response Types:**

1. **Connection Confirmation:**
```json
{
  "type": "connection",
  "data": {
    "status": "connected",
    "agent_id": "agent-uuid"
  }
}
```

2. **Typing Indicator:**
```json
{
  "type": "typing",
  "data": {
    "status": "typing"
  }
}
```

3. **Agent Response:**
```json
{
  "type": "message",
  "data": {
    "message": "I found some great options...",
    "tool_calls": [...]
  }
}
```

4. **Tool Calls:**
```json
{
  "type": "tool_calls",
  "data": {
    "tool_calls": [...]
  }
}
```

5. **Error:**
```json
{
  "type": "error",
  "data": {
    "message": "Error processing message"
  }
}
```

---

## Frontend Integration Guide

### 1. Authentication Setup
```javascript
// Using Clerk
import { useAuth } from '@clerk/nextjs'

const { getToken } = useAuth()

const apiCall = async (endpoint, options = {}) => {
  const token = await getToken()
  
  return fetch(`http://localhost:8000${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
}
```

### 2. WebSocket Connection
```javascript
const connectToAgent = (agentId, clientId) => {
  const ws = new WebSocket(`ws://localhost:8000/api/chat/ws/${agentId}/${clientId}`)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch(data.type) {
      case 'connection':
        console.log('Connected to agent:', data.data.agent_id)
        break
      case 'typing':
        // Show typing indicator
        break
      case 'message':
        // Display agent response
        console.log('Agent:', data.data.message)
        break
      case 'error':
        console.error('Error:', data.data.message)
        break
    }
  }
  
  return ws
}

// Send message
const sendMessage = (ws, message) => {
  ws.send(JSON.stringify({ message }))
}
```

### 3. Complete Workflow Example
```javascript
// 1. Create an agent
const createAgent = async () => {
  const response = await apiCall('/api/agents/', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Medical Shop Assistant',
      description: 'Helps customers with medicine inquiries',
      system_prompt: 'You are a helpful pharmacy assistant...'
    })
  })
  return response.json()
}

// 2. Create a vector table
const createTable = async (agentId) => {
  const response = await apiCall('/api/vector-tables/', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      name: 'medicines',
      display_name: 'Medicine Inventory',
      description: 'Database of available medicines',
      columns: [
        { name: 'medicine_name', type: 'string', description: 'Name of medicine' },
        { name: 'price', type: 'number', description: 'Price per unit' },
        { name: 'category', type: 'string', description: 'Medicine category' }
      ]
    })
  })
  return response.json()
}

// 3. Add data to table
const addMedicines = async (tableId) => {
  const response = await apiCall(`/api/vector-tables/${tableId}/records/batch`, {
    method: 'POST',
    body: JSON.stringify([
      {
        data: {
          medicine_name: 'Paracetamol 500mg',
          price: 5.99,
          category: 'Pain Relief'
        }
      }
    ])
  })
  return response.json()
}

// 4. Create a task
const createTask = async (agentId, tableId) => {
  const response = await apiCall('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      task_name: 'search_medicines',
      task_description: 'Help customers search for medicines by name, category, or symptoms',
      table_id: tableId
    })
  })
  return response.json()
}

// 5. Chat with agent
const chatWithAgent = async (agentId, message) => {
  const response = await apiCall('/api/chat/', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      message: message
    })
  })
  return response.json()
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created successfully
- `204`: Deleted successfully
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `404`: Resource not found
- `500`: Internal server error

### Authentication Errors
```json
{
  "status": "error",
  "message": "Authentication failed. Invalid token.",
  "error_code": "AUTH_ERROR",
  "details": "Token validation failed"
}
```

---

## Data Models

### Agent
```typescript
interface Agent {
  id: string
  name: string
  description?: string
  system_prompt: string
  created_at?: string
  updated_at?: string
}
```

### Vector Table
```typescript
interface VectorTable {
  id: string
  agent_id: string
  name: string
  display_name?: string
  description?: string
  columns: ColumnSchema[]
  created_at?: string
  updated_at?: string
}

interface ColumnSchema {
  name: string
  type: string
  description?: string
}
```

### Task
```typescript
interface Task {
  id: string
  agent_id: string
  task_name: string
  task_description: string
  tools?: any
  table_reference?: any
  is_active: boolean
  created_at?: string
  updated_at?: string
}
```

### Vector Record
```typescript
interface VectorRecord {
  id: string
  table_id: string
  data: Record<string, any>
  created_at?: string
  updated_at?: string
}
```

### Search Result
```typescript
interface SearchResult {
  id: string
  data: Record<string, any>
  similarity: number
}
```

---

## Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
HOST=localhost
PORT=8000

# Production flag for Clerk
PROD=off  # Set to "on" for production
```

---

## Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector_tables table
CREATE TABLE IF NOT EXISTS vector_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    columns JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector_records table
CREATE TABLE IF NOT EXISTS vector_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES vector_tables(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    tools JSONB,
    table_reference JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vector_records_table_id ON vector_records(table_id);
CREATE INDEX IF NOT EXISTS idx_vector_records_embedding ON vector_records USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_vector_tables_agent_id ON vector_tables(agent_id);
```

This documentation provides everything you need to build a frontend that integrates with your dynamic task generation backend!


# API Curl Examples

Complete API documentation with curl examples for all endpoints.

## Authentication

All endpoints require authentication via Bearer token:

```bash
# Set your token
export TOKEN="test_token_123456789"  # For testing
# or use your Clerk JWT token
export TOKEN="your_clerk_jwt_token"
```

## Base URL
```bash
export BASE_URL="http://localhost:8000"
```

---

## 🤖 Agents API

### Create Agent
```bash
curl -X POST "$BASE_URL/api/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Medical Assistant",
    "description": "AI assistant for medical queries",
    "system_prompt": "You are a helpful medical assistant. Always provide accurate information and suggest consulting healthcare professionals."
  }'
```

### Get All Agents (User's Own)
```bash
curl -X GET "$BASE_URL/api/agents" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Specific Agent
```bash
curl -X GET "$BASE_URL/api/agents/{agent_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Agent
```bash
curl -X PUT "$BASE_URL/api/agents/{agent_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Medical Assistant",
    "description": "Enhanced AI assistant for medical queries"
  }'
```

### Delete Agent
```bash
curl -X DELETE "$BASE_URL/api/agents/{agent_id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Vector Tables API

### Create Vector Table
```bash
curl -X POST "$BASE_URL/api/vector-tables" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_123",
    "name": "medicines_db",
    "display_name": "Medicines Database",
    "description": "Database of medicines and their information",
    "columns": [
      {
        "name": "medicine_name",
        "type": "string",
        "description": "Name of the medicine"
      },
      {
        "name": "dosage",
        "type": "string", 
        "description": "Recommended dosage"
      },
      {
        "name": "side_effects",
        "type": "string",
        "description": "Known side effects"
      }
    ]
  }'
```

### Get Agent's Vector Tables
```bash
curl -X GET "$BASE_URL/api/vector-tables/agent/{agent_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Specific Vector Table
```bash
curl -X GET "$BASE_URL/api/vector-tables/{table_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Vector Table
```bash
curl -X PUT "$BASE_URL/api/vector-tables/{table_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Updated Medicines Database",
    "description": "Enhanced database of medicines and their information"
  }'
```

### Delete Vector Table
```bash
curl -X DELETE "$BASE_URL/api/vector-tables/{table_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Import CSV to Vector Table
```bash
curl -X POST "$BASE_URL/api/vector-tables/import-csv/{agent_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_medicines.csv" \
  -F "table_name=medicines_imported" \
  -F "table_display_name=Imported Medicines" \
  -F "table_description=Medicines imported from CSV"
```

---

## 📝 Vector Records API

### Add Single Record
```bash
curl -X POST "$BASE_URL/api/vector-tables/{table_id}/records" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "medicine_name": "Aspirin",
      "dosage": "100mg daily",
      "side_effects": "Stomach irritation, bleeding risk"
    }
  }'
```

### Add Multiple Records (Batch)
```bash
curl -X POST "$BASE_URL/api/vector-tables/{table_id}/records/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "data": {
        "medicine_name": "Paracetamol",
        "dosage": "500mg every 6 hours",
        "side_effects": "Rare: liver damage with overdose"
      }
    },
    {
      "data": {
        "medicine_name": "Ibuprofen", 
        "dosage": "200mg every 8 hours",
        "side_effects": "Stomach upset, kidney issues"
      }
    }
  ]'
```

### Get All Records
```bash
curl -X GET "$BASE_URL/api/vector-tables/{table_id}/records?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Record
```bash
curl -X PUT "$BASE_URL/api/vector-tables/{table_id}/records/{record_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "medicine_name": "Aspirin",
      "dosage": "75mg daily (updated)",
      "side_effects": "Stomach irritation, bleeding risk, allergic reactions"
    }
  }'
```

### Delete Record
```bash
curl -X DELETE "$BASE_URL/api/vector-tables/{table_id}/records/{record_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Search Records (Vector Similarity)
```bash
curl -X POST "$BASE_URL/api/vector-tables/{table_id}/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pain relief medicine",
    "limit": 5,
    "similarity_threshold": 0.3
  }'
```

---

## 🎯 Tasks API

### Create Task
```bash
curl -X POST "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_123",
    "task_name": "search_medicines",
    "task_description": "Search for medicines based on symptoms or conditions",
    "table_id": "table_123",
    "is_active": true
  }'
```

### Get Agent's Tasks
```bash
curl -X GET "$BASE_URL/api/tasks/agent/{agent_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Specific Task
```bash
curl -X GET "$BASE_URL/api/tasks/{task_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Task
```bash
curl -X PUT "$BASE_URL/api/tasks/{task_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "enhanced_medicine_search",
    "task_description": "Enhanced search for medicines with detailed information",
    "is_active": true
  }'
```

### Delete Task
```bash
curl -X DELETE "$BASE_URL/api/tasks/{task_id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💬 Chat API

### Chat with Agent (HTTP)
```bash
curl -X POST "$BASE_URL/api/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_123",
    "message": "What medicine can help with headaches?",
    "conversation_history": [
      {
        "role": "user",
        "content": "Hello"
      },
      {
        "role": "assistant", 
        "content": "Hi! How can I help you today?"
      }
    ]
  }'
```

### WebSocket Chat
```javascript
// JavaScript WebSocket example
const ws = new WebSocket('ws://localhost:8000/api/chat/ws/{agent_id}/{client_id}');

ws.onopen = function() {
    console.log('Connected to chat');
    
    // Send message
    ws.send(JSON.stringify({
        message: "What are the side effects of aspirin?"
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};
```

---

## 🏥 Health Check

### Health Status
```bash
curl -X GET "$BASE_URL/health"
```

---

## 📋 Complete Workflow Example

Here's a complete workflow to set up an agent with vector tables and chat:

```bash
# 1. Create an agent
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Medical Assistant",
    "description": "AI assistant for medical queries",
    "system_prompt": "You are a helpful medical assistant."
  }')

AGENT_ID=$(echo $AGENT_RESPONSE | jq -r '.id')
echo "Created agent: $AGENT_ID"

# 2. Import CSV data
TABLE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vector-tables/import-csv/$AGENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample_medicines.csv" \
  -F "table_name=medicines" \
  -F "table_display_name=Medicines Database")

TABLE_ID=$(echo $TABLE_RESPONSE | jq -r '.table_id')
echo "Created table: $TABLE_ID"

# 3. Create a task
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$AGENT_ID\",
    \"task_name\": \"search_medicines\",
    \"task_description\": \"Search for medicines based on symptoms\",
    \"table_id\": \"$TABLE_ID\",
    \"is_active\": true
  }")

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "Created task: $TASK_ID"

# 4. Chat with the agent
curl -X POST "$BASE_URL/api/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$AGENT_ID\",
    \"message\": \"What medicine can help with headaches?\",
    \"conversation_history\": []
  }"
```

---

## 🔧 Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

---

## 🔐 Authentication Notes

1. **Test Token**: Use `test_token_123456789` for development
2. **Clerk JWT**: Use your Clerk JWT token for production
3. **User Isolation**: All resources are isolated by user - you can only access your own agents, tables, tasks, and records
4. **Token Format**: Always use `Bearer {token}` format in Authorization header