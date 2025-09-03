// Framework discovery and loading utilities

import { Framework, Domain, DomainReference, AppConfig, Question } from './types';

/**
 * Discovers all available frameworks from the /frameworks/ directory
 * Reads manifest files to get framework metadata
 */
export async function discoverFrameworks(): Promise<Framework[]> {
  try {
    // Load the main config to get framework definitions
    const configResponse = await fetch('/config.json');
    if (!configResponse.ok) {
      throw new Error('Failed to load application config');
    }
    
    const config: AppConfig = await configResponse.json();
    const frameworks: Framework[] = [];

    // Process each framework defined in config
    for (const frameworkDef of config.frameworks) {
      try {
        const manifestPath = `${frameworkDef.path}${frameworkDef.manifest}`;
        const manifestResponse = await fetch(manifestPath);
        
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          
          frameworks.push({
            id: frameworkDef.id,
            name: frameworkDef.name,
            path: frameworkDef.path,
            manifest: frameworkDef.manifest,
            enabled: frameworkDef.enabled,
            description: frameworkDef.description,
            icon: frameworkDef.icon,
            color: frameworkDef.color,
            mode: frameworkDef.mode,
            domains: manifest.domains || [],
            totalControls: manifest.totalControls || 0,
            estimatedTime: manifest.estimatedTime || 60,
          });
        } else {
          console.warn(`Failed to load manifest for ${frameworkDef.id}: ${manifestPath}`);
        }
      } catch (error) {
        console.warn(`Error loading framework ${frameworkDef.id}:`, error);
      }
    }

    return frameworks.filter(f => f.enabled);
  } catch (error) {
    console.error('Failed to discover frameworks:', error);
    return [];
  }
}

/**
 * Loads a specific framework by ID
 */
export async function loadFramework(frameworkId: string): Promise<Framework | null> {
  const frameworks = await discoverFrameworks();
  return frameworks.find(f => f.id === frameworkId) || null;
}

/**
 * Loads all domain data for a framework
 * Reads individual domain JSON files based on manifest
 */
export async function loadDomains(framework: Framework): Promise<Domain[]> {
  const domains: Domain[] = [];

  for (const domainRef of framework.domains) {
    try {
      const domainPath = `${framework.path}${domainRef.file}`;
      const response = await fetch(domainPath);
      
      if (response.ok) {
        const domainData = await response.json();
        domains.push({
          ...domainRef,
          ...domainData,
        });
      } else {
        console.warn(`Failed to load domain ${domainRef.id} from ${domainPath}`);
      }
    } catch (error) {
      console.error(`Error loading domain ${domainRef.id}:`, error);
    }
  }

  return domains;
}

/**
 * Loads a specific domain by ID from a framework
 */
export async function loadDomain(framework: Framework, domainId: string): Promise<Domain | null> {
  const domainRef = framework.domains.find(d => d.id === domainId);
  if (!domainRef) {
    return null;
  }

  try {
    const domainPath = `${framework.path}${domainRef.file}`;
    const response = await fetch(domainPath);
    
    if (response.ok) {
      const domainData = await response.json();
      return {
        ...domainRef,
        ...domainData,
      };
    }
  } catch (error) {
    console.error(`Error loading domain ${domainId}:`, error);
  }

  return null;
}

/**
 * Gets all questions from a framework in flat array
 * Useful for progress calculation and navigation
 */
export async function getAllQuestions(framework: Framework): Promise<Question[]> {
  const domains = await loadDomains(framework);
  const allQuestions: Question[] = [];

  for (const domain of domains) {
    if (domain.questions) {
      allQuestions.push(...domain.questions);
    }
  }

  return allQuestions;
}

/**
 * Finds a specific question by ID across all domains
 */
export async function findQuestion(framework: Framework, questionId: string): Promise<{
  question: Question;
  domain: Domain;
  questionIndex: number;
  domainIndex: number;
} | null> {
  const domains = await loadDomains(framework);

  for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
    const domain = domains[domainIndex];
    if (domain.questions) {
      const questionIndex = domain.questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        return {
          question: domain.questions[questionIndex],
          domain,
          questionIndex,
          domainIndex,
        };
      }
    }
  }

  return null;
}

/**
 * Calculates progress statistics for a session
 */
export function calculateProgress(
  totalQuestions: number,
  responses: Record<string, any>
): {
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  percentage: number;
} {
  const responseValues = Object.values(responses);
  const answeredQuestions = responseValues.filter(r => 
    r && r.answer && !['skipped'].includes(r.answer)
  ).length;
  
  const skippedQuestions = responseValues.filter(r => 
    r && (r.answer === 'skipped' || r.autoSkipped)
  ).length;

  const percentage = totalQuestions > 0 
    ? Math.round(((answeredQuestions + skippedQuestions) / totalQuestions) * 100)
    : 0;

  return {
    totalQuestions,
    answeredQuestions,
    skippedQuestions,
    percentage,
  };
}

/**
 * Validates that a framework has all required files
 */
export async function validateFramework(framework: Framework): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check manifest exists
  try {
    const manifestResponse = await fetch(`${framework.path}${framework.manifest}`);
    if (!manifestResponse.ok) {
      errors.push(`Manifest file not found: ${framework.manifest}`);
    }
  } catch (error) {
    errors.push(`Failed to load manifest: ${error}`);
  }

  // Check all domain files exist
  for (const domainRef of framework.domains) {
    try {
      const domainResponse = await fetch(`${framework.path}${domainRef.file}`);
      if (!domainResponse.ok) {
        errors.push(`Domain file not found: ${domainRef.file}`);
      }
    } catch (error) {
      errors.push(`Failed to load domain ${domainRef.id}: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets framework statistics
 */
export async function getFrameworkStats(framework: Framework): Promise<{
  totalDomains: number;
  totalControls: number;
  level1Controls: number;
  level2Controls: number;
  estimatedTime: number;
}> {
  const domains = await loadDomains(framework);
  let totalControls = 0;
  let level1Controls = 0;
  let level2Controls = 0;

  for (const domain of domains) {
    if (domain.questions) {
      totalControls += domain.questions.length;
      for (const question of domain.questions) {
        if (question.level === 1) {
          level1Controls++;
        } else if (question.level === 2) {
          level2Controls++;
        }
      }
    }
  }

  return {
    totalDomains: domains.length,
    totalControls,
    level1Controls,
    level2Controls,
    estimatedTime: framework.estimatedTime,
  };
}

/**
 * Loads the application configuration
 */
export async function loadAppConfig(): Promise<AppConfig | null> {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to load app config:', error);
  }
  return null;
}

/**
 * Gets available answer options from config
 */
export async function getAnswerOptions() {
  const config = await loadAppConfig();
  return config?.answerOptions || [
    { value: 'yes', label: 'Yes', subtext: 'We have this', icon: 'CheckCircle', color: 'green', score: 1.0 },
    { value: 'partial', label: 'Partial', subtext: 'Some but not all', icon: 'Clock', color: 'yellow', score: 0.5 },
    { value: 'no', label: 'No', subtext: 'Not in place', icon: 'XCircle', color: 'red', score: 0.0 },
    { value: 'unsure', label: 'Not Sure', subtext: 'Need to verify', icon: 'AlertCircle', color: 'gray', score: 0.0, requiresFollowUp: true },
    { value: 'na', label: 'N/A', subtext: 'Not applicable', icon: 'MinusCircle', color: 'gray', score: null, excluded: true },
  ];
}