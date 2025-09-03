// Core TypeScript interfaces for CMMC Gap Analysis Tool

export interface Framework {
  id: string;
  name: string;
  path: string;
  manifest: string;
  enabled: boolean;
  description: string;
  icon: string;
  color: string;
  mode?: string;
  domains: DomainReference[];
  totalControls: number;
  estimatedTime: number;
}

export interface DomainReference {
  id: string;
  name: string;
  file: string;
  icon: string;
  controls: number;
}

export interface Domain {
  domain: string;
  title: string;
  icon: string;
  description: string;
  level: number;
  questions: Question[];
}

export interface Question {
  id: string;
  control: string;
  question: string;
  context: string;
  examples: string;
  followUp: string;
  level: number;
  nistSource?: string;
  assessmentObjectives?: string[];
  dependencies?: Dependencies;
}

export interface Dependencies {
  requires?: string[];
  autoFail?: string[];
  skipIfNo?: string[];
  skipIfNA?: string[];
  enables?: string[];
}

export interface Answer {
  answer: 'yes' | 'partial' | 'no' | 'unsure' | 'na' | 'skipped';
  notes?: string;
  confidence?: 'low' | 'medium' | 'high';
  evidenceOrganized?: boolean;
  timestamp: string;
  controlId: string;
  questionId: string;
  autoFailed?: boolean;
  autoSkipped?: boolean;
  skipReason?: string;
}

export interface Session {
  id: string;
  clientId: string;
  frameworkId: string;
  mode: 'quick' | 'detailed';
  status: 'in-progress' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  completedAt: string | null;
  currentDomain: number;
  currentQuestion: number;
  responses: Record<string, Answer>;
  progress: {
    totalQuestions: number;
    answeredQuestions: number;
    completionPercentage: number;
    currentDomain: number;
    currentQuestion: number;
    domains: Record<string, any>;
  };
  statistics: {
    totalControls: number;
    assessed: number;
    remaining: number;
    results: {
      yes: number;
      partial: number;
      no: number;
      unsure: number;
      notApplicable: number;
      notAssessed: number;
    };
    byDomain: Record<string, any>;
    score: {
      current: number;
      projected: number;
      confidence: 'low' | 'medium' | 'high';
    };
    criticalFindings: Array<{
      controlId: string;
      issue: string;
      risk: 'low' | 'medium' | 'high' | 'critical';
      impact: string;
    }>;
  };
  homework: Array<{
    id: string;
    controlId: string;
    question: string;
    assignedTo: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed';
    notes?: string;
  }>;
  session: {
    duration: number;
    startTime: string;
    endTime: string | null;
    pauseEvents: Array<{
      timestamp: string;
      duration: number;
    }>;
    completionPercentage: number;
  };
  signatures: {
    consultant: {
      name: string;
      date: string | null;
      signed: boolean;
    };
    client: {
      name: string;
      title: string;
      date: string | null;
      signed: boolean;
    };
  };
  metadata: {
    version: string;
    tool: string;
    toolVersion: string;
  };
}

export interface Client {
  id: string;
  companyName: string;
  dba?: string;
  industry?: string;
  logo?: string;
  size: {
    employees: number;
    revenue: string;
    locations: number;
  };
  contact: {
    primary: ContactInfo;
    technical?: ContactInfo;
    executive?: ContactInfo;
  };
  address: Address;
  contracts: {
    hasFederalContracts: boolean;
    contractTypes: string[];
    primeOrSub: string;
    agencies: string[];
    handlesCUI: boolean;
    handlesFCI: boolean;
  };
}

export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AssessmentData {
  id: string;
  clientId: string;
  type: string;
  mode: 'quick' | 'detailed';
  status: 'in-progress' | 'completed';
  dates: {
    created: string;
    started: string;
    lastModified: string;
    completed?: string;
    expires?: string;
  };
  consultant: {
    name: string;
    email: string;
    company: string;
    certifications: string[];
  };
  scope: {
    systemName: string;
    systemDescription: string;
    boundaries: {
      users: number;
      workstations: number;
      servers: number;
      locations: string[];
      cloudServices: string[];
    };
    dataTypes: {
      cui: boolean;
      fci: boolean;
      pii: boolean;
      phi: boolean;
      financial: boolean;
    };
  };
}

export interface AnswerOption {
  value: string;
  label: string;
  subtext: string;
  icon: string;
  color: string;
  score: number;
  excluded?: boolean;
  requiresFollowUp?: boolean;
}

export interface AppConfig {
  application: {
    name: string;
    version: string;
    description: string;
    company: string;
    support: string;
  };
  frameworks: Framework[];
  assessmentModes: {
    quick: AssessmentMode;
    detailed: AssessmentMode;
  };
  answerOptions: AnswerOption[];
  features: Record<string, any>;
  ui: Record<string, any>;
  export: Record<string, any>;
  dependencies: {
    rules: Record<string, any>;
  };
  scoring: Record<string, any>;
}

export interface AssessmentMode {
  name: string;
  description: string;
  questionsPerControl: number | string;
  includeFollowUp: boolean;
  trackEvidenceOrganization: boolean;
  estimatedTimeMultiplier: number;
}

export interface HomeworkItem {
  id: string;
  sessionId: string;
  questionId: string;
  controlId: string;
  question: string;
  context: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  response?: Answer;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkPackage {
  id: string;
  sessionId: string;
  clientId: string;
  frameworkId: string;
  items: HomeworkItem[];
  createdAt: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: string;
}

export interface ScoreResult {
  score: number;
  total: number;
  met: number;
  partial: number;
  notMet: number;
  unsure: number;
  skipped: number;
  percentage: number;
  level: string;
  recommendations: string[];
}

// UI State interfaces
export interface NavigationState {
  currentDomain: number;
  currentQuestion: number;
  sidebarOpen: boolean;
  showProgress: boolean;
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Utility types
export type QuestionStatus = 'answered' | 'skipped' | 'pending' | 'auto-failed';
export type SessionStatus = 'not-started' | 'in-progress' | 'completed' | 'paused';
export type FrameworkLevel = 1 | 2;
export type AssessmentType = 'quick' | 'detailed' | 'delta';

// Export helper type for strongly typed localStorage keys
export type LocalStorageKey = 
  | `session_${string}`
  | `client_${string}` 
  | 'recentSessions'
  | 'recentClients'
  | 'frameworks'
  | 'appConfig';