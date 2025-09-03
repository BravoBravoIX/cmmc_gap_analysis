// Client management utilities - Updated for file-based storage

import { Client, Session } from './types';

// Generate UUID helper
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API helper for making requests
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Create a new client
export async function createClient(clientData: Partial<Client>, customId?: string): Promise<Client> {
  const id = customId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newClient = {
    ...clientData,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const client = await apiRequest('/api/clients', {
      method: 'POST',
      body: JSON.stringify(newClient),
    });

    return client;
  } catch (error) {
    console.error('Failed to create client:', error);
    throw new Error('Failed to create client. Please try again.');
  }
}

// Get a specific client by ID
export async function getClient(clientId: string): Promise<Client | null> {
  try {
    const client = await apiRequest(`/api/clients/${clientId}`);
    return client;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    console.error('Failed to get client:', error);
    throw new Error('Failed to load client. Please try again.');
  }
}

// Get all clients
export async function getAllClients(): Promise<Client[]> {
  try {
    const clients = await apiRequest('/api/clients');
    return clients;
  } catch (error) {
    console.error('Failed to get all clients:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}

// Update an existing client
export function updateClient(clientId: string, updates: Partial<Client>): Promise<Client> {
  return apiRequest(`/api/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Delete a client
export async function deleteClient(clientId: string): Promise<void> {
  try {
    await apiRequest(`/api/clients/${clientId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete client:', error);
    throw new Error('Failed to delete client. Please try again.');
  }
}

// Get recent clients (for backward compatibility)
export async function getRecentClients(): Promise<Client[]> {
  try {
    const clients = await getAllClients();
    // Return up to 20 most recent clients (API already sorts by updatedAt)
    return clients.slice(0, 20);
  } catch (error) {
    console.error('Failed to get recent clients:', error);
    return [];
  }
}

// Validate client data
export function validateClient(client: Partial<Client>): { valid: boolean; errors: string[]; warnings: string[]; } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!client.companyName?.trim()) {
    errors.push('Company name is required');
  }

  if (!client.contact?.primary?.name?.trim()) {
    errors.push('Primary contact name is required');
  }

  if (!client.contact?.primary?.email?.trim()) {
    errors.push('Primary contact email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.contact.primary.email)) {
    errors.push('Valid email address is required');
  }

  if (!client.industry?.trim()) {
    warnings.push('Industry is recommended for better reporting');
  }

  if (!client.size?.employees || client.size.employees <= 0) {
    warnings.push('Number of employees is recommended');
  }

  // Contract validation
  if (client.contracts?.hasFederalContracts) {
    if (!client.contracts.contractTypes?.length) {
      warnings.push('Contract types should be specified for federal contractors');
    }
    if (!client.contracts.agencies?.length) {
      warnings.push('Agencies should be specified for federal contractors');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Session management functions (for backward compatibility)

// Create a new session
export async function createSession(clientId: string, frameworkId: string, mode: 'quick' | 'detailed' = 'detailed'): Promise<Session> {
  try {
    // Verify client exists
    const client = await getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const session = await apiRequest('/api/assessments', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        frameworkId,
        mode
      }),
    });

    return session;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error('Failed to create assessment session. Please try again.');
  }
}

// Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const session = await apiRequest(`/api/assessments/${sessionId}`);
    return session;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    console.error('Failed to get session:', error);
    throw new Error('Failed to load assessment session. Please try again.');
  }
}

// Get all sessions for a client
export async function getClientSessions(clientId: string): Promise<Session[]> {
  try {
    const sessions = await apiRequest(`/api/clients/${clientId}/assessments`);
    return sessions;
  } catch (error) {
    console.error('Failed to get client sessions:', error);
    return [];
  }
}

// Save session response
export async function saveSessionResponse(sessionId: string, questionId: string, answer: any): Promise<void> {
  try {
    await apiRequest(`/api/assessments/${sessionId}/response`, {
      method: 'POST',
      body: JSON.stringify({
        questionId,
        answer
      }),
    });
  } catch (error) {
    console.error('Failed to save session response:', error);
    throw new Error('Failed to save response. Please try again.');
  }
}

// Update session
export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
  try {
    const session = await apiRequest(`/api/assessments/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return session;
  } catch (error) {
    console.error('Failed to update session:', error);
    throw new Error('Failed to update assessment session. Please try again.');
  }
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await apiRequest(`/api/assessments/${sessionId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw new Error('Failed to delete assessment session. Please try again.');
  }
}

// Legacy localStorage functions (deprecated but kept for migration compatibility)
export function saveToLocalStorage(key: string, data: any) {
  console.warn('saveToLocalStorage is deprecated. Data is now saved to file system automatically.');
  // No-op for backward compatibility
}

export function loadFromLocalStorage(key: string) {
  console.warn('loadFromLocalStorage is deprecated. Use API functions instead.');
  return null;
}