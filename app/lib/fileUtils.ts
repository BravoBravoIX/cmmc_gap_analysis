import fs from 'fs/promises';
import path from 'path';
import { Mutex } from 'async-mutex';
import { Client, Session } from './types';

export class FileSystemManager {
  private dataPath: string;
  private clientMutexes = new Map<string, Mutex>();
  private sessionMutexes = new Map<string, Mutex>();

  constructor() {
    this.dataPath = process.env.DATA_PATH || './data';
  }

  // Utility method for safe concurrent file operations
  private async withLock<T>(mutexMap: Map<string, Mutex>, key: string, operation: () => Promise<T>): Promise<T> {
    if (!mutexMap.has(key)) {
      mutexMap.set(key, new Mutex());
    }
    
    const mutex = mutexMap.get(key)!;
    return mutex.runExclusive(operation);
  }

  // Ensure directory exists
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Client Operations
  async saveClient(client: Client): Promise<void> {
    return this.withLock(this.clientMutexes, client.id, async () => {
      const clientDir = path.join(this.dataPath, 'clients', client.id);
      await this.ensureDirectory(clientDir);
      await this.ensureDirectory(path.join(clientDir, 'assessments'));
      await this.ensureDirectory(path.join(clientDir, 'reports'));

      // Add timestamps if not present
      const now = new Date().toISOString();
      const clientData = {
        ...client,
        updatedAt: now,
        createdAt: client.createdAt || now
      };

      const profilePath = path.join(clientDir, 'profile.json');
      await fs.writeFile(profilePath, JSON.stringify(clientData, null, 2));
    });
  }

  async loadClient(clientId: string): Promise<Client | null> {
    try {
      const profilePath = path.join(this.dataPath, 'clients', clientId, 'profile.json');
      const data = await fs.readFile(profilePath, 'utf8');
      return JSON.parse(data) as Client;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async listClients(): Promise<Client[]> {
    try {
      const clientsDir = path.join(this.dataPath, 'clients');
      await this.ensureDirectory(clientsDir);
      
      const clientDirs = await fs.readdir(clientsDir);
      const clients: Client[] = [];

      for (const clientDir of clientDirs) {
        try {
          const client = await this.loadClient(clientDir);
          if (client) {
            clients.push(client);
          }
        } catch (error) {
          console.warn(`Failed to load client ${clientDir}:`, error);
        }
      }

      // Sort by updatedAt descending (most recent first)
      return clients.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Failed to list clients:', error);
      return [];
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    return this.withLock(this.clientMutexes, clientId, async () => {
      const clientDir = path.join(this.dataPath, 'clients', clientId);
      try {
        await fs.rm(clientDir, { recursive: true, force: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  }

  // Session Operations
  async saveSession(session: Session): Promise<void> {
    return this.withLock(this.sessionMutexes, session.id, async () => {
      const clientDir = path.join(this.dataPath, 'clients', session.clientId);
      const assessmentsDir = path.join(clientDir, 'assessments');
      await this.ensureDirectory(assessmentsDir);

      // Add timestamps if not present
      const now = new Date().toISOString();
      const sessionData = {
        ...session,
        updatedAt: now,
        createdAt: session.createdAt || now
      };

      const sessionPath = path.join(assessmentsDir, `${session.frameworkId}_${session.id}.json`);
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
    });
  }

  async loadSession(sessionId: string): Promise<Session | null> {
    try {
      // Search for session across all clients (since we only have sessionId)
      const clientsDir = path.join(this.dataPath, 'clients');
      await this.ensureDirectory(clientsDir);
      const clientDirs = await fs.readdir(clientsDir);

      for (const clientDir of clientDirs) {
        const assessmentsDir = path.join(clientsDir, clientDir, 'assessments');
        try {
          const assessmentFiles = await fs.readdir(assessmentsDir);
          
          for (const file of assessmentFiles) {
            if (file.includes(sessionId)) {
              const sessionPath = path.join(assessmentsDir, file);
              const data = await fs.readFile(sessionPath, 'utf8');
              return JSON.parse(data) as Session;
            }
          }
        } catch (error) {
          // Skip if assessments directory doesn't exist
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  async listClientSessions(clientId: string): Promise<Session[]> {
    try {
      const assessmentsDir = path.join(this.dataPath, 'clients', clientId, 'assessments');
      await this.ensureDirectory(assessmentsDir);
      
      const assessmentFiles = await fs.readdir(assessmentsDir);
      const sessions: Session[] = [];

      for (const file of assessmentFiles) {
        if (file.endsWith('.json')) {
          try {
            const sessionPath = path.join(assessmentsDir, file);
            const data = await fs.readFile(sessionPath, 'utf8');
            const session = JSON.parse(data) as Session;
            sessions.push(session);
          } catch (error) {
            console.warn(`Failed to load session file ${file}:`, error);
          }
        }
      }

      // Sort by updatedAt descending (most recent first)
      return sessions.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    } catch (error) {
      console.error(`Failed to list sessions for client ${clientId}:`, error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.withLock(this.sessionMutexes, sessionId, async () => {
      const session = await this.loadSession(sessionId);
      if (!session) return;

      const assessmentsDir = path.join(this.dataPath, 'clients', session.clientId, 'assessments');
      const sessionPath = path.join(assessmentsDir, `${session.frameworkId}_${sessionId}.json`);
      
      try {
        await fs.unlink(sessionPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  }

  // Utility Operations
  async ensureClientDirectory(clientId: string): Promise<void> {
    const clientDir = path.join(this.dataPath, 'clients', clientId);
    await this.ensureDirectory(clientDir);
    await this.ensureDirectory(path.join(clientDir, 'assessments'));
    await this.ensureDirectory(path.join(clientDir, 'reports'));
  }

  async validateDataIntegrity(): Promise<boolean> {
    try {
      // Check if data directory exists
      await this.ensureDirectory(this.dataPath);
      
      // Check if clients directory exists
      const clientsDir = path.join(this.dataPath, 'clients');
      await this.ensureDirectory(clientsDir);
      
      // Validate each client directory structure
      const clientDirs = await fs.readdir(clientsDir);
      
      for (const clientDir of clientDirs) {
        const profilePath = path.join(clientsDir, clientDir, 'profile.json');
        
        // Check if profile.json exists and is valid
        try {
          const data = await fs.readFile(profilePath, 'utf8');
          JSON.parse(data); // Validate JSON structure
        } catch (error) {
          console.error(`Invalid client profile: ${clientDir}`, error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Data integrity validation failed:', error);
      return false;
    }
  }

  async getStorageStats(): Promise<{
    totalClients: number;
    totalSessions: number;
    diskUsage: string;
  }> {
    try {
      const clients = await this.listClients();
      let totalSessions = 0;
      
      for (const client of clients) {
        const sessions = await this.listClientSessions(client.id);
        totalSessions += sessions.length;
      }

      return {
        totalClients: clients.length,
        totalSessions,
        diskUsage: 'N/A' // Could implement with additional system calls if needed
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalClients: 0,
        totalSessions: 0,
        diskUsage: 'Error'
      };
    }
  }
}

// Singleton instance
let fsmInstance: FileSystemManager | null = null;

export function getFileSystemManager(): FileSystemManager {
  if (!fsmInstance) {
    fsmInstance = new FileSystemManager();
  }
  return fsmInstance;
}