import axios, { AxiosInstance } from "axios";
import { API_BASE_URL } from "./utils";

export interface Agent {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  created_at?: string;
  updated_at?: string;
}

export interface VectorTable {
  id: string;
  agent_id: string;
  name: string;
  display_name?: string;
  description?: string;
  columns: ColumnSchema[];
  created_at?: string;
  updated_at?: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  description?: string;
}

export interface VectorRecord {
  id: string;
  table_id: string;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  agent_id: string;
  task_name: string;
  task_description: string;
  tools?: any;
  table_reference?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChatRequest {
  agent_id: string;
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  message: string;
  tool_calls?: Array<{
    tool: string;
    input: any;
    output: string;
  }>;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(token?: string) {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    const { data } = await this.client.get("/api/agents/");
    return data;
  }

  async getAgent(id: string): Promise<Agent> {
    const { data } = await this.client.get(`/api/agents/${id}`);
    return Array.isArray(data) ? data[0] : data;
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    const { data } = await this.client.post("/api/agents/", agent);
    return data;
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const { data } = await this.client.put(`/api/agents/${id}`, agent);
    return data;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.client.delete(`/api/agents/${id}`);
  }

  // Vector Tables
  async getAgentTables(agentId: string): Promise<VectorTable[]> {
    const { data } = await this.client.get(`/api/vector-tables/agent/${agentId}`);
    return data;
  }

  async getTable(id: string): Promise<VectorTable> {
    const { data } = await this.client.get(`/api/vector-tables/${id}`);
    return data;
  }

  async createTable(table: Partial<VectorTable>): Promise<VectorTable> {
    const { data } = await this.client.post("/api/vector-tables/", table);
    return data;
  }

  async updateTable(id: string, table: Partial<VectorTable>): Promise<VectorTable> {
    const { data } = await this.client.put(`/api/vector-tables/${id}`, table);
    return data;
  }

  async deleteTable(id: string): Promise<void> {
    await this.client.delete(`/api/vector-tables/${id}`);
  }

  async getRecords(tableId: string, limit = 100): Promise<VectorRecord[]> {
    const { data } = await this.client.get(`/api/vector-tables/${tableId}/records`, {
      params: { limit },
    });
    return data;
  }

  async addRecord(tableId: string, record: { data: Record<string, any> }): Promise<VectorRecord> {
    const { data } = await this.client.post(`/api/vector-tables/${tableId}/records`, record);
    return data;
  }

  async addRecordsBatch(tableId: string, records: Array<{ data: Record<string, any> }>): Promise<VectorRecord[]> {
    const { data } = await this.client.post(`/api/vector-tables/${tableId}/records/batch`, records);
    return data;
  }

  async updateRecord(tableId: string, recordId: string, record: { data: Record<string, any> }): Promise<VectorRecord> {
    const { data } = await this.client.put(`/api/vector-tables/${tableId}/records/${recordId}`, record);
    return data;
  }

  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    await this.client.delete(`/api/vector-tables/${tableId}/records/${recordId}`);
  }

  async searchRecords(tableId: string, query: string, limit = 5, similarity_threshold = 0.4): Promise<VectorRecord[]> {
    const { data } = await this.client.post(`/api/vector-tables/${tableId}/search`, {
      query,
      limit,
      similarity_threshold,
    });
    return data;
  }

  async importCSV(agentId: string, file: File, tableName: string, tableDisplayName?: string, tableDescription?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("table_name", tableName);
    if (tableDisplayName) formData.append("table_display_name", tableDisplayName);
    if (tableDescription) formData.append("table_description", tableDescription);

    const { data } = await this.client.post(`/api/vector-tables/import-csv/${agentId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  }

  // Tasks
  async getAgentTasks(agentId: string): Promise<Task[]> {
    const { data } = await this.client.get(`/api/tasks/agent/${agentId}`);
    return data;
  }

  async getTask(id: string): Promise<Task> {
    const { data } = await this.client.get(`/api/tasks/${id}`);
    return data;
  }

  async createTask(task: Partial<Task> & { table_id: string }): Promise<Task> {
    const { data } = await this.client.post("/api/tasks/", task);
    return data;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const { data } = await this.client.put(`/api/tasks/${id}`, task);
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/api/tasks/${id}`);
  }

  // Chat
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await this.client.post("/api/chat/", request);
    return data;
  }

  // Streaming Chat
  async streamChat(
    request: ChatRequest,
    onMessage: (delta: string, fullContent: string) => void,
    onComplete: (message: string) => void,
    onError: (error: string) => void,
    token?: string
  ): Promise<void> {
    try {
      // Build headers - use the same pattern as axios client
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      };

      // Add authorization header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (this.client.defaults.headers.common['Authorization']) {
        headers['Authorization'] = this.client.defaults.headers.common['Authorization'] as string;
      } else {
        throw new Error('No authorization token available');
      }

      const response = await fetch(`${this.client.defaults.baseURL}/api/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              this.handleStreamEvent(data, onMessage, onComplete, onError);
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private handleStreamEvent(
    event: any,
    onMessage: (delta: string, fullContent: string) => void,
    onComplete: (message: string) => void,
    onError: (error: string) => void
  ) {
    switch (event.type) {
      case 'chat_start':
        // Chat session started
        break;
      case 'content_delta':
        onMessage(event.data.delta, event.data.full_content);
        break;
      case 'chat_complete':
        onComplete(event.data.message);
        break;
      case 'error':
        onError(event.data.message);
        break;
      default:
        console.warn('Unknown event type:', event.type);
    }
  }

  // Enhancement APIs
  async enhanceSystemPrompt(agentName: string, agentDescription: string, systemPrompt: string): Promise<{ original_prompt: string; enhanced_prompt: string }> {
    const { data } = await this.client.post("/api/agents/enhance-prompt", {
      agent_name: agentName,
      agent_description: agentDescription,
      system_prompt: systemPrompt,
    });
    return data;
  }

  async enhanceTaskDescription(taskName: string, taskDescription: string, agentId?: string): Promise<{ original_description: string; enhanced_description: string }> {
    const { data } = await this.client.post("/api/tasks/enhance-description", {
      task_name: taskName,
      task_description: taskDescription,
      ...(agentId && { agent_id: agentId }),
    });
    return data;
  }

  async createAgentWithEnhancement(agent: Partial<Agent>, enhancePrompt: boolean = true): Promise<Agent> {
    const { data } = await this.client.post(`/api/agents?enhance_prompt=${enhancePrompt}`, agent);
    return data;
  }

  async createTaskWithEnhancement(task: Partial<Task> & { table_id?: string }, enhanceDescription: boolean = true): Promise<Task> {
    const { data } = await this.client.post(`/api/tasks?enhance_description=${enhanceDescription}`, task);
    return data;
  }
}

export const createApiClient = (token?: string) => new ApiClient(token);

